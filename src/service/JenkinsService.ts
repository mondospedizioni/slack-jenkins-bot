import axios from 'axios';
import Config from '@app/config/config';
import { objectToQueryString } from '@app/util/String';
import { JenkinsError } from '@app/error/JenkinsError';
import { BuildInterface } from '@app/interface/BuildInterface';
import { v5 as uuidv5 } from 'uuid';
import { namespace as buildNamespace } from '@app/model/Build';
import { DateTime } from 'luxon';
import { spawn, Thread, Worker } from 'threads';
import { WorkerJobInfo } from '@app/worker/retrieveJobInfo';
import { WorkerJobStatus } from '@app/worker/checkJobStatus';
import { sleep } from '@app/util/System';
import { saveBuildEnded, saveBuildStarted } from '@app/repository/BuildRepository';
import { JobInterface } from '@app/interface/JobInterface';
import { callbackSlack } from '@app/service/SlackService';
import { severityType, SlackSlashResponse } from '@app/util/SlackSlash';
import { SlashSlashResponseOptions } from '@app/interface/slackInterface';
import { ReqInterface } from '@app/interface/ReqInterface';

/**
 * The main method for calling jenkins
 *
 * @param job
 * @param jenkinsCommandParams
 * @param request
 */
export const jenkinsCall = async (job: JobInterface, jenkinsCommandParams: any, request: ReqInterface) => {
  /**
   * Execute the jenkins job
   */
  const getterJobInfoUrl = await executeJob(job.job, jenkinsCommandParams);

  /**
   * Check and save the started build
   */
  let build = await saveBuildStarted(
    await retrieveJobInfo(getterJobInfoUrl, job.uuid, request.uuid),
  );

  /**
   * Check and save if the job is finished
   */
  build = await checkJobFinished(job.job, build);
  await saveBuildEnded(build);

  await callbackSlack(request, SlackSlashResponse(<SlashSlashResponseOptions>{
    response_type: 'in_channel',
    title: decodeURIComponent(job.job),
    message: (build.status == 'SUCCESS') ? `:tada: finished!` : `:firecracker: failed!`,
    severity: (build.status == 'SUCCESS') ? severityType.success : severityType.error,
  }));
};

/**
 * Call Jenkins Api for the selected job
 *
 * @param jobName
 * @param params
 */
const executeJob = async (jobName: string, params: any): Promise<string> => {
  try {
    const apiUrl = composeBuildJobApiUrl(jobName, params);
    const response = await axios({
      url: apiUrl,
      method: 'post',
      params,
      auth: {
        username: Config.jenkins.username,
        password: Config.jenkins.password,
      },
    });

    return response.headers.location;
  } catch (e) {
    throw new JenkinsError(e);
  }
};

/**
 * Retrieve job information from jenkins
 *
 * @param getterJobInfoUrl
 * @param jobId
 * @param reqId
 */
const retrieveJobInfo = async (getterJobInfoUrl: string, jobId: string, reqId: string): Promise<any> => {

  const worker = await spawn<typeof WorkerJobInfo>(new Worker(`../worker/retrieveJobInfo`));

  try {
    let item;
    do {
      await sleep(3000);
      item = await worker.retrieveJobInfoWorker(getterJobInfoUrl);
    }
    while (!item?.executable?.hasOwnProperty('number'));

    return <BuildInterface>{
      uuid: uuidv5(process.hrtime(), buildNamespace),
      date_start: DateTime.fromMillis(item.inQueueSince).toSQL({ includeOffset: false }),
      build_number: item.executable?.number,
      job_uuid: jobId,
      req_uuid: reqId,
    };
  } catch (error) {
    console.error(error);
  } finally {
    await Thread.terminate(worker);
  }
};

/**
 * Check if the job is finished
 *
 * @param jobName
 * @param build
 */
const checkJobFinished = async (jobName: string, build: BuildInterface): Promise<any> => {
  const worker = await spawn<typeof WorkerJobStatus>(new Worker(`../worker/checkJobStatus`));
  const getterBaseJobApiUrl = composeBuildedJobApiUrl(jobName, build.build_number);
  try {
    let item;
    do {
      await sleep(5000);
      item = await worker.retrieveJobStatusWorker(getterBaseJobApiUrl);
    }
    while (item?.result != 'SUCCESS' && item?.result != 'FAILURE');

    return <BuildInterface>{
      uuid: build.uuid,
      date_start: build.date_start,
      date_end: DateTime.fromMillis(item.timestamp).toSQL({ includeOffset: false }),
      build_number: build.build_number,
      job_uuid: build.job_uuid,
      req_uuid: build.req_uuid,
      status: item.result
    };
  } catch (error) {
    console.error(error);
  } finally {
    await Thread.terminate(worker);
  }
};

/**
 * @param jobName
 * @param buildNumber
 */
const composeBuildedJobApiUrl = (jobName: string, buildNumber: string): string => {
  return `${Config.jenkins.domain}/job/${jobName}/${buildNumber}/`;
};

/**
 * @param jobName
 */
const composeBaseJobApiUrl = (jobName: string): string => {
  return `${Config.jenkins.domain}/job/${jobName}/`;
};

/**
 * @param jobName
 * @param params
 */
const composeBuildJobApiUrl = (jobName: string, params: [any]): string => {
  const baseUrl: string = composeBaseJobApiUrl(jobName);
  let queryString: string = '';
  let typeBuild: string = 'build';
  if (params.length > 0) {
    typeBuild = 'buildWithParameters';
    queryString = `&${objectToQueryString(params)}`;
  }
  return `${baseUrl}${typeBuild}?token=${Config.jenkins.token}${queryString}`;
};