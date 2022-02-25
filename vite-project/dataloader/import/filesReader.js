const ora = require('ora');
const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

const timer = require('../utils');

const splitCSV = (csv) => {
  const rows = csv.split('\n');
  const headers = rows.shift().split(',');
  let types = rows.shift().split(',');
  types = types.map((t) => t.replace(/[^a-zA-Z0-9 -]/gi, ''));
  const numberOfRows = rows.length;
  return { headers, types, numberOfRows };
};

const readFiles = async (fileExtension, excelFilePath, csvFolderPath) => {
  try {
    let spinner;
    const data = [];
    if (fileExtension === 'Excel') {
      spinner = ora('Start reading files...').start();
      const workbook = XLSX.readFile(excelFilePath);
      spinner.succeed('Reading completed!');

      // Start Reading Spreadsheet data
      spinner = ora('Start reading sheets data... \n').start();
      workbook.SheetNames.forEach((name) => {
        const start = Date.now();
        let csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name], { blankrows: false });
        if (!csv) return spinner.fail('Spreadsheet is empty. Please export a template first.');

        const { headers, types, numberOfRows } = splitCSV(csv);

        csv = cleanRows(headers, csv);


        if (numberOfRows <= 0) return spinner.fail(`No data found in "${name}" sheet.`);

        spinner.info(`${numberOfRows} rows found for "${name}" in ${timer(start)}`);
        data.push({
          name, headers, types, content: csv,
        });
      });
    } else {
      spinner = ora('Start reading csv data... \n').start();

      const csvFiles = fs.readdirSync(csvFolderPath);
      const promises = csvFiles
        .filter((file) => path.extname(file) == '.csv')
        .map(async (fileName) => {
          const start = Date.now();
          let csv = fs.readFileSync(`${csvFolderPath}${fileName}`, 'utf8');
          const name = fileName.split('.')[0];
          const { headers, types, numberOfRows } = splitCSV(csv);

          csv = cleanRows(headers, csv);


          if (numberOfRows <= 0) return spinner.fail(`No data found in "${name}" sheet.`);
          spinner.info(`${numberOfRows} rows found for "${name}" in ${timer(start)}`);
          data.push({
            name, headers, types, content: csv, info: fs.statSync(`${csvFolderPath}${fileName}`),
          });
        });
      await Promise.all(promises);
    }
    spinner.succeed('Files Reading completed!');
    return data;
  } catch (error) {
    console.error(error);
    spinner.fail('Could not read excel file');
    return false;
  }
};

function cleanRows(headers, csv) {

  const rows = csv.split('\n');
  // clean ids
  const _idIndex = headers.indexOf('_id');
  const sourceIdIndex = headers.indexOf('source_id');
  const targetIdIndex = headers.indexOf('target_id');

  const filteredRows = rows.map((row) => {
    const splittedRow = row.split(',');
    const filteredRow = splittedRow.map((cell, index) => {
      const validIdIndex = (index === _idIndex && _idIndex > -1);
      const validSourceIdIndex = (index === sourceIdIndex && sourceIdIndex > -1);
      const validTargetIdIndex = (index === targetIdIndex && targetIdIndex > -1);
      if ((validIdIndex || validSourceIdIndex || validTargetIdIndex) && (cell != null)) {
        return cell.replace(/[.]/gi, '-');
      }
      return cell
    });
    return filteredRow.join(',');
  });
  return filteredRows.join('\n');
}

module.exports = readFiles;
