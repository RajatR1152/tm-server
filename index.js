const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const users = require('./modules/user');
const tasks = require('./modules/TaskModule');
const jwt = require('jsonwebtoken');
const jwtscerete = "secrete124";
const port = 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(`mongodb+srv://rajat:rajat123@cluster0.otatf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connection successful"))
    .catch(err => console.error(" $ $ $ Connection failed: $ $ $ ", err));

const authenticateJWT = (req, res, next) => {

    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
        jwt.verify(token, jwtscerete, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

app.get('/',(req,res)=>{
    res.send("ok...");
})

app.post('/login', (req, res) => {
    try {
        users.findOne({ email: req.body.email }).then(async (data) => {
            if (data) {
                const passwordMatch = await bcrypt.compare(req.body.password, data.password);
                if (passwordMatch) {
                    const token = jwt.sign({ id: data._id, email: data.email }, jwtscerete, { expiresIn: '1h' });
                    return res.json({
                        status: 'ok',
                        user: true,
                        token: token
                    });
                } else {
                    return res.json({ status: 'error', user: false, message: 'Invalid credentials' });
                }
            } else {
                return res.json({ status: 'error', user: false, message: 'User not found' });
            }
        });
    } catch (error) {
        console.log("Invalid email");
        return res.json({ status: 'error', message: 'Login failed', error });
    }
});

app.post('/register', async (req, res) => {
    try {

        users.findOne({ email: req.body.email }).then(async (d) => {
            if (d) {
                res.send({ created: false, message: "user already exist" });
            }
            else {
                const hashedPassword = await bcrypt.hash(req.body.password, 10);

                const userData = {
                    username: req.body.username,
                    email: req.body.email,
                    password: hashedPassword,
                    title: req.body.title
                };

                const newUser = new users(userData);
                await newUser.save();
                return res.json({ status: 'ok', message: 'User created successfully ! please login', created: true });
            }
        })

    } catch (error) {
        return res.json({ status: 'error', message: 'User registration failed', error });
    }
});

app.get('/protected', authenticateJWT, (req, res) => {
    res.json({ message: 'You are authorized!', user: req.user });
});

app.post('/users', async (req, res) => {
    const data = await users.find().then((d) => {
        res.send(d);
    })
})

app.post('/create', (req, res) => {

    try {
        const newTask = tasks(req.body);
        newTask.save().then(() => {
            res.send({ saved: true, message: 'task created successfully' });
        })
    }
    catch {
        res.send({ saved: false, message: 'task created successfully' });
    }

})

app.post('/gettasks', async (req, res) => {
    try {
        await tasks.find().then((data) => {
            res.send(data);
        })
    }
    catch {
        console.log('something went wrong');
    }
})

app.post('/delete', (req, res) => {
    tasks.deleteOne(req.body).then((d) => {
        res.send({ deleted: true, data: d })
        console.log(d);
    })
})

app.post('/getpost', (req, res) => {
    tasks.findOne(req.body).then((d) => {
        res.send({ found: true, data: d })
    })
})

app.post('/update', async (req, res) => {
    try {
        const result = await tasks.updateOne({ _id: req.body._id }, { $set: req.body });

        if (result.nModified === 1) {
            res.send({ edited: true, message: 'Data updated successfully' });
        } else {
            res.send({ edited: false, message: 'No document found or no changes made' });
        }
    } catch (error) {
        console.error('Error during update:', error);
        res.send({ edited: false, message: 'Error updating document' });
    }
})

app.listen(port, () => {
    console.log("Listening on port", port);
});
