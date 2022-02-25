require('dotenv').config();
const inquirer = require('inquirer');
const fs = require('fs-extra');

const exportTemplate = require('./export/export');
const importData = require('./import/import');

const excelFilePath = './importFiles/excel/dataLoader.xlsx';
const csvFolderPath = './importFiles/csv/';

//  Create dataLoader.xlsx if not exists
const initPaths = () => {
  try {
    const excelFile = fs.existsSync(excelFilePath);
    if (!excelFile) {
      fs.createFileSync(excelFilePath);
    }
    const csvFolder = fs.existsSync(csvFolderPath);
    if (!csvFolder) {
      fs.mkdirSync(csvFolderPath);
    }
  } catch (error) {
    console.info(writeError.message);
    process.exit(0);
  }
};

const start = async () => {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: ['Export Template', 'Import Data'],
    },
  ]);
  if (action === 'Export Template') await exportTemplate(excelFilePath);
  if (action === 'Import Data') await importData(excelFilePath, csvFolderPath);
};

initPaths();
start();
