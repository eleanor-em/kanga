const express = require('express');

const { json } = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 7337;

app.use(json());
app.use(express.static('web'));

function removeIfExists(file) {
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
    }
}

function cleanup(file_id) {
    removeIfExists(`bin/src/${file_id}.roo`);
    removeIfExists(`bin/src/${file_id}.oz`);
    removeIfExists(`bin/src/${file_id}.in`);
}

function cleanErr(err) {
    return err.toString()
        .replace(/\x1b\[[0-9;]*m/g, '')
        .replace(/bin\/src\/.*\.roo/g, 'file.roo');
}

app.post('/run', (req, res) => {
    if ('code' in req.body && 'input' in req.body) {
        const { code, input } = req.body;
        const file_id = uuidv4();

        fs.writeFile(`bin/src/${file_id}.roo`, code, err => {
            if (err) {
                console.log(`Error writing to file: ${err}`);
                res.send({ value: 'error during compilation' });
                cleanup(file_id);
            } else {
                exec(`bin/Roo bin/src/${file_id}.roo > bin/src/${file_id}.oz`, (err, stdout, stderr) => {
                    if (err) {
                        res.send({ value: cleanErr(stderr) });
                        cleanup(file_id);
                    } else if (stderr.length > 0) {
                        res.send({ value: cleanErr(stderr) });
                        cleanup(file_id);
                    } else {
                        fs.writeFile(`bin/src/${file_id}.in`, input, err => {
                            if (err) {
                                console.log(`Error writing to file: ${err}`);
                                res.send({ value: 'error during compilation' });
                                cleanup(file_id);
                            } else {
                                exec(`bin/oz/oz bin/src/${file_id}.oz < bin/src/${file_id}.in`, (err, stdout, stderr) => {
                                    if (err) {
                                        console.log(`Error writing to file: ${err}`);
                                        res.send({ value: 'error during execution' });
                                        cleanup(file_id);
                                    } else {
                                        res.send({ value: stdout + '\n' + cleanErr(stderr) });
                                        cleanup(file_id);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    } else {
        console.log('Invalid message received.');
        res.send({ value: 'error parsing message' });
    }
});

app.listen(port, () => {
    console.log(`Listening at port ${port}...`);
});
