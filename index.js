const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const temp = require('temp');
const fs = require('fs');

app.get('/node/pdf-printer/download', (req, res) => {
	let url = req.query.url;
	let currentBrowser = null;
	let currentPage = null;
	let tempName = null;
	let options = {};
	let format = 'A4';
	if (req.query.asfile) {
		options = {
			headers: {
				'Content-Disposition': 'attachment; filename=download.pdf'
			}
		};
	}
	if (req.query.format) {
		format = req.query.format;
	}
	puppeteer.launch()
		.then((browser) => {
			currentBrowser = browser;
			return currentBrowser.newPage();
		})
		.then((page) => {
			currentPage = page;
			return currentPage.goto(url, {waitUntil: 'networkidle2'});
		})
		.then(() => {
			tempName = temp.path({suffix: '.pdf'});
			return currentPage.pdf({path: tempName, format: format});
		})
		.then(() => {
			return currentBrowser.close();
		})
		.then(() => {
			res.sendFile(tempName, options, function (err) {
				fs.unlink(tempName);
			});
		});
});

app.listen(process.env.PORT, () => {
	console.log('Web PDF Printer service running on port ' + process.env.PORT);
});