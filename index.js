const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const temp = require('temp');
const fs = require('fs');

app.get('/node/pdf-printer/download', (req, res) => {
	let url = req.query.url;
	let printedBy = req.query.by || '-';
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
			return currentPage.goto(url, {waitUntil: 'networkidle0'});
		})
		.then(() => {
			var ft = [];
			ft.push('<div style="font-size:10px; width:100%; text-align:right; padding-right: 20px; padding-left: 20px;">');
			ft.push('<div style="display: inline-block; float: left;">');
			ft.push('Printed By: ');
			ft.push(printedBy);
			ft.push('</div>');
			ft.push('<div style="display: inline-block; float: right;">');
			ft.push('Page <span class="pageNumber"></span> ');
			ft.push('of ');
			ft.push('<span class="totalPages"></span>');
			ft.push('</div>');
			ft.push('</div>');

			tempName = temp.path({suffix: '.pdf'});
			currentPage.emulateMedia('print');
			return currentPage.pdf({
				path: tempName,
				format: format,
				displayHeaderFooter: true,
				footerTemplate: ft.join(''),
				margin: {
					bottom: "100px"
				}
			});
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