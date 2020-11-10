const extractFrames = require("./ffmpeg-extract-frames");
const { readdirSync } = require("fs");
var path = require("path");
var fs = require("fs");
const ffmpeg = require('fluent-ffmpeg');
const async = require('async');

const source = path.join(__dirname, 'source');
const target = path.join(__dirname, 'target');

const getDirectories = async (source) => {
  console.log('Start extract frames ...')

  const folder = [];
  readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => {
      folder.push(dirent.name);
      fs.mkdirSync(`${target}/${dirent.name}`, { recursive: true });
    });

  let options = [];

  for (let i = 0; i < folder.length; i++) {
    readdirSync(`${source}/${folder[i]}`, { withFileTypes: true })
      .filter((file) => file.isFile())
      .map((file) => {
        const extname = path.extname(file.name).substr(1);
        if (extname === "mp4") {
          fileName = file.name.split(".").slice(0, -1).join(".");

          let input = `${source}/${folder[i]}/${file.name}`;
          let output = `${target}/${folder[i]}/${fileName}-%d.png`;
          const cmd = ffmpeg(input)
            .on('start', (cmd) => { })

          options.push({
            input,
            output,
            numFrames: 100,
            cmd,
            fileName,
            scale: '-1:500'
          })
        }
        return;
      });
  }

  var queue = async.queue(function ({ cmd, output }, callback, error) {
    setTimeout(function () {
      cmd
        .on('end', () => callback())
        .on('error', (err) => error())
        .output(output)
        .run();
    }, 500);
  }, 1);


  // assign a callback
  queue.drain = (() => { console.log('All items have been processed'); })

  let count = 0;

  await Promise.all(options.map(async option => {
    let output = option.output;

    let cmd = await extractFrames(option);

    queue.push(
      { cmd, output },
      () => {
        count++;
        process.stdout.write(`Extracting ${count}/${options.length} video complete... \r`);
      },
      () => {
        console.log(`Something wrong with video ${fileName}`)
      });
  }))
};

getDirectories(source);
