const fs = require('fs');
const Grid = require('gridfs-stream');
const mongoose = require('mongoose');
const config = require('./config');

// const IMMUNIZATION = require('./immunization');

//Start mongodb connection
const dbconnection = require('./database/db.js');
const gfs = () => dbconnection.getGfs();

const MediaAsset = require('./database/schemas/MediaAsset');
const Organization = require('./database/schemas/Organization');
const User = require('./database/schemas/User');
const Game = require('./database/schemas/Game');
const activities = require('./database/schemas/Activities');
const MemoryActivity = activities.MemoryActivity;
const QuizActivity = activities.QuizActivity;

function createUser(email, password,  name, role, _id) {
  const user = new User();

  if (_id) {
    user._id = _id;
  }

  user.email = email;
  user.password = password;
  user.name = name;
  user.role = role;

  return(user);
}

function createOrganization(user, role, name, memberRequests, _id, ) {
  const org = new Organization();

  if (_id) {
    org._id = _id;
  }

  org.name = name;
  org.members = [{role: role, user: user}];
  org.memberRequests = memberRequests;

  return(org);
}

function createMediaAsset(org, user, mediaContent, title, description, keywords, language) {
  const asset = new MediaAsset();

  asset.owner = org;
  asset.creator = user;
  asset.mediaContent = mediaContent;
  asset.language = language;
  asset.metadata.keywords = keywords
  asset.metadata.title = title;
  asset.metadata.description = description;

  return(asset);
}

function createMediaContent(path, filename, contentType) {
  const writestream = gfs().createWriteStream({
    filename: filename,
    content_type: contentType
  })
  fs.createReadStream(path + filename).pipe(writestream)

  const resultPromise = new Promise((resolve, reject) => {
    writestream.on('close', function (file) {
      resolve(file._id)
    });
  });
  return (resultPromise)
}

function createMemoryActivity(mediaAsset1, mediaAsset2){
  const activity = new MemoryActivity();

  activity.pairs = [{
    item1: {mediaAsset: mediaAsset1},
    item2: {mediaAsset: mediaAsset2},
    explanation: "It is obvious ..."
  }];

  return(activity);
}

function createQuizActivity(question, asset, answers, correctAnswer){
  const activity = new QuizActivity();

  activity.questions = [
    {
      question: {
        text: question,
        mediaAsset: asset
      },
      answers: answers,
      correctAnswer: correctAnswer
    }
  ];

  return(activity);
}
function createGame(owner, activity, name){
  const game = new Game();

  game.owner = owner;
  game.name = name;
  game.activities = [activity];

  return(game);
}

async function main(application) {
  console.log("PROCESSING ...");

  await dbconnection.getDB().dropDatabase();


  const admin = createUser('admin@admin.com', 'adminPass', 'Admin Name', 'Admin');
  await admin.save();

  const johny = createUser('curator@curator.com', 'curatorPass', 'Curator Name', 'Curator');
  await johny.save();


  const org = createOrganization(admin, 'Admin'/*'Member'*/, 'CeNef', [johny]);
  await org.save();

  const org2 = createOrganization(admin, 'Admin'/*'Member'*/, 'Mesto Bardejov', []);
  await org2.save();

  const mediaContent = await createMediaContent("./init/media/", "DurerMother.png", "image/png");

  const mediaAsset = createMediaAsset(org, admin, mediaContent, "Portrait of the Artist's Mother at the Age of 63",
  "Charcoal drawing by the German printmaker and painter Albrecht Dürer, now in the Kupferstichkabinett museum in Berlin.",
  ["portrait", "durer"], 'en');
  await mediaAsset.save();


  const activity = createMemoryActivity(mediaAsset, mediaAsset)

  const game = createGame(org, activity, "Durer")
  await game.save();


  const activity2 = createQuizActivity(
    "Kto je autor tohto obrazu?", mediaAsset,
    ["Durer", "Picasso", "Munch", "Galanda"], 0)

  const game2 = createGame(org, activity2, "Obraz")
  await game2.save();

  await dbconnection.disconnectDB();
  process.exit();
}

var stdin = process.openStdin();

// Wait while db is initialized
setTimeout(() => {
  console.log("==================================================================");
  console.log("ARE YOU SURE, ALL DATA IN " + config.dbURI + " WILL BE DELETED (Y/N)!: [N]");
}, 2000);

stdin.addListener("data", function(d) {
    if (d.toString().trim() == "Y") {
      main();
    } else {
      process.exit();
    }
  });
