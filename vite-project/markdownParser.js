const fs = require('fs');
const path = require('path');
const readline = require('readline');

const helpFolder = './help/';
const generalHelpFolder = helpFolder + 'generalDoc/';
const techHelpFolder = helpFolder + 'techDoc/';
const filesProcessing = [];

// regex finders
const h1 = /^# (.*$)/gim
const h2 = /^## (.*$)/gim
const h3 = /^### (.*$)/gim
const txt = /(.|\s)*\S(.|\s)*/im

const lunrDocArrays = [];

// list markdown files in help folder

/**
 * 
 * @param {*} folderPath 
 * @param {*} level 
 * @returns 
 */
const parseFolder = async (folderPath, level = 0) => {
  return new Promise((resolve, reject) => {
    // read elements of a folder
    fs.readdir(folderPath, async (err, elts) => {

      // for each element
      for (elt of elts) {
        if (path.extname(elt) === '.md') {
          // this is a markdown file
          // console.log(level, `${folderPath}${elt}/`);

          // parse file
          filesProcessing.push(processLineByLine(`${folderPath}${elt}`, elt));

          // console file parsed

        } else if (path.extname(elt) === '') {
          // FOLDER
          await parseFolder(`${folderPath}${elt}/`, level + 1);
        }
      };

      Promise.all(filesProcessing).then((values) => {
        var merged = [].concat.apply([], values);
        resolve(merged);
      })
    });
  })

}

/**
 * 
 * @param {*} filepath 
 * @param {*} filename 
 * @returns 
 */
const processLineByLine = async (filepath, filename) => {
  return new Promise(async (resolve, reject) => {
    const lunrPageDocs = [];
    const fileStream = fs.createReadStream(filepath);
    let titles = [];
    let level = 0;

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.
    for await (const line of rl) {
      // Each line in input.txt will be successively available here as `line`.
      if (h1.test(line)) {
        titles[0] = line;
        level = 0;
        lunrPageDocs.push({
          file: filename,
          name: line,
          text: '',
          filepath: filepath,
          url: '',
        });
      } else if (h2.test(line)) {
        titles[1] = line;
        level = 1;
        lunrPageDocs.push({
          file: filename,
          parent: titles[0],
          name: line,
          text: '',
          filepath: filepath,
          url: '',
        });
      } else if (h3.test(line)) {
        titles[2] = line;
        level = 2;
        lunrPageDocs.push({
          file: filename,
          parent: titles[1],
          name: line,
          text: '',
          filepath: filepath,
          url: '',
        });
      } else if (txt.test(line)) {
        // console.log("LOG / file: markdownParser.js / line 89 / forawait / lunrPageDocs", lunrPageDocs.length);
        if (lunrPageDocs.length === 0) {
          lunrPageDocs.push({
            file: filename,
            name: line,
            text: line,
            filepath: filepath,
            url: '',
          });
        } else {
          if (level > 2) {
            lunrPageDocs[lunrPageDocs.length - 1].text = lunrPageDocs[lunrPageDocs.length - 1].text + ' ' + line;
          } else {
            lunrPageDocs[lunrPageDocs.length - 1].text = line;
          }
        }
        level = 3;
      }
    }
    lunrPageDocs.map((lunrPageDoc) => {
      if (lunrPageDoc.filepath) {
        lunrPageDoc.filepath = lunrPageDoc.filepath.replace('techDoc', 'tech');
        lunrPageDoc.filepath = lunrPageDoc.filepath.replace('generalDoc', 'documentation');
        lunrPageDoc.filepath = lunrPageDoc.filepath.replace('.md', '.html');
      }
      return lunrPageDoc;
    })
    resolve(lunrPageDocs);
  });
}




const parseFnt = async () => {
  console.time('General Documentation index generation');
  const generalHelpIndex = await parseFolder(generalHelpFolder);
  // save arrays to files
  try {
    if (fs.existsSync('./help/_generalDoc/')) {
      fs.writeFile('./help/_generalDoc/generalHelpIndex.json', JSON.stringify(generalHelpIndex), 'utf8', (err) => {
        if (err) {
          return console.log(err);
        }

        console.timeEnd('General Documentation index generation');
      });
    }


    console.time('Tech Documentation index generation');
    const techHelpIndex = await parseFolder(techHelpFolder);

    if (fs.existsSync('./help/_techDoc/')) {
      fs.writeFile('./help/_techDoc/techHelpIndex.json', JSON.stringify(techHelpIndex), 'utf8', (err) => {
        if (err) {
          return console.log(err);
        }

        console.timeEnd('Tech Documentation index generation');
      });
    }
  } catch (error) {
    console.error(error);
  }
};
parseFnt();