require('dotenv').config();
const inquirer = require('inquirer');
const xl = require('excel4node');
const _ = require('lodash');
const { exec } = require('child_process');

//  Get Datamodel
const datamodel = require('../../build/datamodel.json');

const colorCell = (workBook, color, pattern, textColor = '#000000') => {
	return workBook.createStyle({
		font: {
			color: textColor,
		},
		fill: {
			type: 'pattern',
			fgColor: color,
			bgColor: color,
			patternType: pattern || 'solid',
		},
	});
}

const createWSNodetype = async (nodetype, workBook) => {
	// Add new Sheet
	const ws = await workBook.addWorksheet(nodetype.name);
	// Generate Sheet Content
	const _idProp = nodetype.properties.find((p) => p.name === '_id');
	const _refProp = nodetype.properties.find((p) => p.name === '_ref');
	const properties = [];
	if (nodetype.elementType === 'relationship') {
		properties.push({
			name: 'source_id',
			type: 'string',
			mandatory: true,
		});
		properties.push({
			name: 'target_id',
			type: 'string',
			mandatory: true,
		});
	}
	if (_idProp) properties.push(_idProp);
	if (_refProp) properties.push(_refProp);
	nodetype.properties
		.filter((p) => {
			return p.name !== '_ref' && p.name !== '_id' && !p.core;
		}).forEach((p) => properties.push(p));
		
	nodetype.properties
		.filter((p) => {
			return p.core && !['_id', '_ref', '_promotions', '_history', '_lockable', '_lockState', '_lockedBy', '_lockedByName', '_lockedOn'].includes(p.name);
		})
		.forEach((p) => properties.push(p));
	properties.forEach((p, i) => {
		let cellStyle = colorCell(workBook, '#337ab7', null, '#FFFFFF');
		if (p.core) cellStyle = colorCell(workBook, '#5bc0de', null, '#000000');
		if (p.mandatory) cellStyle = colorCell(workBook, '#f0ad4e', null, '#000000');
		ws.cell(1, i + 1).string(p.name);
		ws.cell(1, i + 1).style(cellStyle);
		ws.cell(2, i + 1).string(p.type);
		ws.cell(2, i + 1).style(cellStyle);
	});
	return workBook;
}

const exportTemplate = async (filePath) => {
	//  Nodetypes
	const nodetypeChoices = ['all'];
	const nodes = datamodel.nodetypeDefinitions.filter((n) => n.elementType === 'node')
	nodes.forEach((n) => nodetypeChoices.push({
		name: n.name,
		key: n.name,
		value: n,
	}));
	let { nodetypes } = await inquirer.prompt([
		{
			choices: nodetypeChoices,
			default: ['all'],
			message: 'Select Nodetypes',
			name: 'nodetypes',
			type: 'checkbox',
		},
	]);
	if (nodetypes.find((n) => n === 'all')) nodetypes = datamodel.nodetypeDefinitions.filter((n) => n.elementType === 'node');
	if (_.isEmpty(nodetypes)) {
		return console.error('Export Exits: No nodetypes selected!');
	}
	const nodetypesIds = nodetypes.map((n) => n.id);

	//  Relationships
	const relationshipsChoices = ['all'];
	const relations = datamodel.nodetypeDefinitions.filter((n) => {
		const { elementType } = n;
		if (elementType !== 'relationship') return;

		return n.directions.find((d) => nodetypesIds.includes(d.source) || nodetypesIds.includes(d.target));
	});
		
	relations.forEach((relationship) =>  {
		relationshipsChoices.push({
			name: relationship.name,
			key: relationship.name,
			value: relationship,
		})
	});
	let { relationships } = await inquirer.prompt([
		{
			choices: relationshipsChoices,
			default: ['all'],
			message: 'Select Relationships',
			name: 'relationships',
			type: 'checkbox',
		},
	]);
	if (relationships.find((relationship) => relationship === 'all')) relationships = relationshipsChoices.filter((r) => r !== 'all').map((r) => r.value);

	//  Create WorkBook
	const workBook = new xl.Workbook({ author: 'Ganister' });


	// create first worksheet for explanations
	await workBook.addWorksheet('introduction');

	nodetypes.filter((n) => !_.isEmpty(n.properties)).forEach((n) => createWSNodetype(n, workBook));
	relationships.filter((n) => !_.isEmpty(n.properties)).forEach((n) => createWSNodetype(n, workBook));
	await workBook.write(filePath);
	exec(`start ${filePath}`, (err) => {
		if (err) return console.error(`Cannot Open Dataloader.xlsx file: ${err.message}`);
	});
};

module.exports = exportTemplate;