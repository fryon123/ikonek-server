// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const ejs = require("ejs");
const app = express();
const path = require("path");
const validator = require("./validator");

app.use(require("body-parser").urlencoded({ extended: false }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

const admin = require("firebase-admin");

const serviceAccount = require("./cert.json");
const password = "FRYON";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const messaging = admin.messaging();
// our default array of dreams
const dreams = [
  "Find and count some sheep",
  "Climb a really tall mountain",
  "Wash the dishes"
];

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/home.html");
});
app.get("/profile/:profile", async (request, response) => {
  let user = await getuserdataReturn(request.params.profile);
  console.log(user);
  if(user.error === "Unknown user.") {response.sendFile(__dirname + "/views/error.html"); return;};
  response.render("profile", {
    name: user.name.toUpperCase(),
    bio: user.bio,
    address: user.address,
    skills: user.skills
  });
});
app.get("/find", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});
//GET
app.get("/jobs/:jobname", (req, res) => {
  let job = req.params.jobname.toLowerCase();
  if (validator.haveSymbols(job)) {
    res.json({status: "error"});
    res.status(500);
    return;
  }
  getjobapplicants(job, res);
});
app.get("/users/:user", (req, res) => {
  getuserdata(req.params.user, res);
});
//POST
app.post("/users/add", (req, res) => {
  console.log(req.body);
  let pass = req.body.password;
  let name = req.body.name;
  let add = req.body.address;
  let num = req.body.number;
  let skills = req.body.skills.split(",");
  let bio = req.body.bio.toString();
  let valid = pass && name && add && num && skills && bio;
  if (valid === false) {
    res.json({ status: "invalid", statusCode: -1 });
    return;
  }

  storeuser(
    {
      name: name.toString(),
      address: add.toString(),
      number: num.toString(),
      skills: skills,
      bio: bio.toString()
    },
    res
  );
});
//FCM
app.post("/messages/push", (req, res) => {
  if(req.body.password !== password) {res.json({stats: "Failed."}); return;};
  const notification_options = {
    priority: "high",
    timeToLive: 60 * 60 * 24
  };
  const message_notification = {
    notification: {
      title: "notif",
      body: req.body.number
    }
  };
  messaging
    .sendToDevice(
      "ccy9e509YUA:APA91bF_fskI2DwXQKM2r1H31r50QVmcn8tMk6-X6RniHgnMZSQ0DDVk4mDUAmvZdNMc1FF8cSePeLDKRlaeVOD15JTyepG8RACGypUUAHg_S5TWg-5VzuzJkGOhTwknaEseu5Kq4b7O",
      message_notification,
      notification_options
    )
    .then(response => {
      res.status(200).send("Notification sent successfully");
    })
    .catch(error => {
      console.log(error);
    });
});
// send the default array of dreams to the webpage
/*app.get("/users/:password", (request, response) => {
  console.log(request.params);
  // express helps us take JS objects and send them as JSON
  if (request.params.password !== password) {
    response.status(400);
    response.json({ message: "Bad Request" });
  } else {
    response.json(["fuck you"]);
  }
});*/
// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

async function storeuser(data, res) {
  let userCol = db.collection("users").doc(data.name.toLowerCase());
  let skillsCol = db.collection("skills");
  let userDone = await userCol.set({
    name: data.name.toLowerCase(),
    address: data.address.toLowerCase(),
    number: data.number,
    skills: data.skills,
    bio: data.bio
  });
  let skillsDone;
  let loop = await data.skills.forEach(async a => {
    let doc = await skillsCol.doc(a);
    let skill = await doc.get();
    if (!skill.exists) await createdoc("skills", a);
    let _skillsDone = await skillsCol.doc(a).update({
      names: admin.firestore.FieldValue.arrayUnion(data.name.toLowerCase())
    });
  });
  console.log(skillsDone);
  if (userDone) res.json({ status: "Well Done." });
  else res.json({ status: "Failed." });
}

async function getjobapplicants(skill, resp) {
  let doc = db.collection("skills").doc(skill);
  let done = await doc.get();
  console.log(done.data());
  resp.status(200);
  resp.json(done.data());
}
async function getuserdata(name, resp) {
  let doc = db.collection("users").doc(name);
  let done = await doc.get();
  resp.set({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  });
  console.log(done.data());
  resp.json(done.data());
}

async function getuserdataReturn(name) {
  let doc = db.collection("users").doc(name);
  let done = await doc.get();
  if (done.exists) return done.data();
  return {error: "Unknown user."};
}
async function createdoc(collection, docname) {
  let userCol = await db.collection(collection).doc(docname);
  let status = await userCol.set({ names: [] });
}
