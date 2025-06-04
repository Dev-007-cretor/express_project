const express = require('express');
const path = require('path');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const port = 3000;

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static('public'));

// File storage
const upload = multer({ dest: 'uploads/' });
const upload2 = multer({dest:'uploads2/'});

app.get('/', (req, res) => {
  res.render('page', { message: null, downloadLink: null });
});
app.get('/index',(req,res)=>{
  res.render('index',{meassage:"pdf_to_word", downloadLink:null});
})
app.get('/index2',(req,res)=>{
  res.render('index2',{meassage:"Word_to_Pdf",downloadLink:null});
})
app.post('/convert', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.render('index', { message: 'No file uploaded.', downloadLink: null });
  }

  const inputPath = path.join(__dirname, req.file.path);
  const outputFilename = `${req.file.filename}.docx`;
  const outputPath = path.join(__dirname, 'converted', outputFilename);

  const command = `python convert.py "${inputPath}" "${outputPath}"`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr);
      return res.render('index', { message: 'Conversion failed.', downloadLink: null });
    }

    // Store inputPath info with the output file name if needed for cleanup later
    fs.writeFileSync(path.join(__dirname, 'converted', `${req.file.filename}.json`), JSON.stringify({ inputPath }));

    return res.render('index', {
      message: 'Conversion successful!',
      downloadLink: `/download/${outputFilename}`,
    });
  });
});
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'converted', filename);

  // Get inputPath from stored json (optional: only if you want to delete input file too)
  const metaFile = path.join(__dirname, 'converted', `${filename.replace('.docx', '')}.json`);
  let inputPath = null;

  if (fs.existsSync(metaFile)) {
    const meta = JSON.parse(fs.readFileSync(metaFile));
    inputPath = meta.inputPath;
  }

  res.download(filePath, (err) => {
    if (err) {
      console.error('Download error:', err);
    }

    // Safely delete both input and output after download
    if (inputPath && fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (fs.existsSync(metaFile)) {
      fs.unlinkSync(metaFile);
    }
  });
});
app.post('/convert2', upload2.single('docx'), (req, res) => {
  if (!req.file) {
    return res.render('index2', { message: 'No file uploaded.', downloadLink: null });
  }

  const oldPath = path.join(__dirname, req.file.path);
  const newFilename = `${req.file.filename}.docx`;
  const newPath = path.join(__dirname, 'uploads2', newFilename);

  // Rename to ensure .docx extension
  fs.renameSync(oldPath, newPath);

  const outputFilename = `${req.file.filename}.pdf`;
  const outputPath = path.join(__dirname, 'converted2', outputFilename);

  const command = `python convert2.py "${newPath}" "${outputPath}"`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr);
      return res.render('index2', { message: 'Conversion failed.', downloadLink: null });
    }

    fs.writeFileSync(path.join(__dirname, 'converted2', `${req.file.filename}.json`), JSON.stringify({ inputPath: newPath }));

    return res.render('index2', {
      message: 'Conversion successful!',
      downloadLink: `/download2/${outputFilename}`,
    });
  });
});
app.get('/download2/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'converted2', filename);
  const metaFile = path.join(__dirname, 'converted2', `${filename.replace('.pdf', '')}.json`);
  let inputPath = null;

  if (fs.existsSync(metaFile)) {
    const meta = JSON.parse(fs.readFileSync(metaFile));
    inputPath = meta.inputPath;
  }

  res.download(filePath, (err) => {
    if (err) {
      console.error('Download error:', err);
    }

    if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (fs.existsSync(metaFile)) fs.unlinkSync(metaFile);
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
