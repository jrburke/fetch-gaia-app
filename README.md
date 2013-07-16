## fetch-gaia-app

A utility for fetching a development version of a
[Gaia](https://github.com/mozilla-b2g/gaia) app.

Probably only useful if you are a UX person working with developers on Gaia.

## Prerequisites

1) You need to be developing [Gaia](https://github.com/mozilla-b2g/gaia). If
you do not have Gaia set up, then do not bother trying to use this tool.

2) [Install Node](http://nodejs.org/). It runs this tool. There are
easy to use installers for the major OS platforms.

## Installation

Open a command line terminal window and type:

    npm install -g fetch-gaia-app

This only works after Node has been installed.

## Fetching an app

Make sure you are in your local git clone of Gaia. This tool will look for
an **apps** directory in the directory where it runs.

## Fetch from an URL

Call the tool with the URL to the ZIP of the app, and pass the name of the
regular Gaia app that relates to it. Example of fetching a version of the
email app from an URL location:

    fetch-gaia-app http://example.com/temp/bug111111.zip email

### Fetch from a GitHub branch

This can take a while, without any useful feedback, since it fetches a full
zip snapshot of all of Gaia. On a fast network connection, it can be around
two minutes before seeing updates in the UI.

The URL fetching is recommended instead. However, if the developer has not
created a ZIP file for the app, this approach can be used.

The basic format of the command is:

fetch-gaia-app username branchid appname

Where:

* **username** is the GitHub user name. They must have a **gaia** fork under
their username for this to work.
* **branchid** the GitHub branch to fetch from the user name's gaia fork.
* **appname** the app that should be fetched.

Example: To fetch the **jrburke**'s **fga** branch version of the
**email** app:

fetch-gaia-app jrburke fga email

## Installing an app

When the app is fetched for the very first time, then it needs to be installed
via:

    make GAIA_OPTIMIZE=1 reset-gaia

**NOTE**: This command will delete any information you have saved on the
phone.

Once the app has been installed once, then after fetching a new version of it
with the same `fetch-gaia-app` command, you can just run:

    make GAIA_OPTIMIZE=1 install-gaia APP=newappname

Where newappname will be displayed at the end of the fetch command. It should
also be the name of the new directory in the **apps** folder.

**NOTE**: Each time fetch-gaia-app is run, it will delete the previous version
of the same app that it fetched before placing the newly fetched version in the
**apps** directory. So do not make modifications in the fetched app unless you
back them up before running the fetch-gaia-app command again.

## Developer notes

### Making a ZIP for URL installation

1) Do your modifications in your branch, and then make sure you are in the
**gaia/apps** directory to run the ZIP command. Name the ZIP after the bug
or branch you are working on. For instance, to make a ZIP file of email app
for bug 111111:

    zip -r bug111111.zip email/*

Then upload that zip file somewhere publicly accessible. Pass that URL to
the UX person, asking them to run a command like this:

    fetch-gaia-app http://example.com/temp/bug111111.zip email

## Troubleshooting

If you see this error occur:

    Error: Unable to find end of central directory record

It means the tool could not correctly unzip the downloaded file. Usually just
trying the command again will work.


