const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const temp = require('temp');
const fs = require('fs');
const moment = require('moment');

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
			ft.push('<div style="font-size:8px; width:100%; text-align:right; padding-right: 20px; padding-left: 20px;">');
			ft.push('<table style="width: 100%"><tr><td style="text-align: left; width: 33%; vertical-align: bottom;">');
			ft.push('Printed By: ');
			ft.push(printedBy);
			ft.push(' ');
			ft.push(moment().format('DD/MM/YYYY HH:mm:ss'));
			ft.push('</td>');
			ft.push('<td style="text-align: right; width: 33%; vertical-align: bottom;">');
			ft.push('<span style="font-size: 8px;">ePDR template created by</span>');
			ft.push('<br>');
			ft.push('<span style="font-size: 8px;">Kanjanapong Y., QA Initiative, Sept\'18</span>');
			ft.push('<br>');
			ft.push('Page <span class="pageNumber"></span> ');
			ft.push('of ');
			ft.push('<span class="totalPages"></span>');
			ft.push('</td></tr>');
			ft.push('</table>');

			tempName = temp.path({suffix: '.pdf'});
			currentPage.emulateMedia('print');
			return currentPage.pdf({
				path: tempName,
				format: format,
				displayHeaderFooter: true,
				headerTemplate: '<span></span>',
				footerTemplate: ft.join(''),
				margin: {
					top: "30px",
					bottom: "70px"
				}
			});
		})
		.then(() => {
			return currentBrowser.close();
		})
		.then(() => {
			res.sendFile(tempName, options, function (err) {
				fs.unlinkSync(tempName);
			});
		});
});

app.listen(process.env.PORT, () => {
	console.log('Web PDF Printer service running on port ' + process.env.PORT);
});
