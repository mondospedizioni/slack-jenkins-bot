# SLACK <-> JENKINS BOT

[![License](http://img.shields.io/badge/license-MIT-green.svg?style=flat)](https://github.com/bsramin/slack-jenkins-bot/blob/main/LICENSE.txt)

This bot allows you to safely and _effectively_ run jobs on jenkins _directly from Slack_, also receiving end-of-execution notifications.
Through permissions it is possible to configure, for each single job, who has the right to execute it from slack and at any time it is possible to check the last jobs performed.

## USAGE

After the [installation](documentation/install.md), from Slack simply run the commands.

Eg.

  `/do job1`

  `/do job2 param1=value1`

  `/do job3 param1=value1 param2=value2`

  `/requests` (the view the latest requests)

## SETUP

Follow the [setup instruction](documentation/install.md)

## FAQ

### How do I access Jenkins server from behind a router?

You can use [ngrok](https://ngrok.com/) or [webhookrelay](https://webhookrelay.com/)

# LICENSE

The MIT License (MIT)

Copyright (c) 2021 Ramin Banihashemi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
