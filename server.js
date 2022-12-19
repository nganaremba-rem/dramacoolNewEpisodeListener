const express = require("express");
const app = express();
require("dotenv").config();
const port = process.env.PORT ?? 3000;
const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");

const url =
  "https://dramacool.sr/drama-detail/alchemy-of-souls-season-2-light-and-shadow-2022";

// middleware
app.set("view engine", "ejs");

const weekday = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const sendMail = async ({ to, subject, msg, html }) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "ngancloverr@gmail.com",
      pass: process.env.MY_APP_KEY,
    },
  });

  const info = await transporter.sendMail({
    from: '"Nganaremba" <ngancloverr@gmail.com>',
    to: to,
    subject: subject,
    text: msg,
    html: html,
  });

  console.log(`Message sent: `, info.messageId);
};

let prevEpisodeLength = 3;

const checkWebsite = async () => {
  let dateToday = Date.now();
  let formattedDate = new Date(dateToday);

  const day = weekday[formattedDate.getDay()];
  if (["Sunday", "Saturday", "Monday"].includes(day)) {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded" });

      const episodesLength = await page.$$eval(
        ".all-episode > li",
        (episodes) => episodes.length,
      );

      const imageLink = await page.$eval(
        ".details > .img > img",
        (img) => img.attributes["src"]?.value,
      );
      console.log(imageLink);

      if (prevEpisodeLength !== episodesLength) {
        prevEpisodeLength = episodesLength;
        const link = await page.$$eval(".all-episode > li", (episodes) => {
          return episodes[0]?.children[0]?.attributes["href"]?.value;
        });
        await page.goto(link, { waitUntil: "domcontentloaded" });

        const myLink = await page.$$eval("#frame_wrap > iframe", (iframes) => {
          const videoLink = iframes[0]?.attributes["src"]?.value;
          console.log(videoLink);
          return `http:${videoLink}`;
        });
        console.log(myLink);
        const dramaName = await page.$eval(
          ".watch-drama > h1",
          (h1) => h1.textContent,
        );

        sendMail({
          to: "ngancloverr@gmail.com",
          msg: myLink,
          subject: `New Episode`,
          html: `<html>
  <head>
    <style>
      body {
        background-color: #333;
      }
      .card {
        background-color: #fff;
        box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
        border-radius: 5px;
        padding: 20px;
      }
      button {
        background: #2a9c7f;
        color: white;
        border: none;
        border-radius: 1000px;
        padding: .5rem 1rem;
      }
      button:hover {
        background: hsl(147, 80%, 80%);
      }
      img {
        width: 200px;
        height: 200px;
        aspect-ratio: 3/2;
        object-fit: contain;
      }
      a{
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <img src="${imageLink}" alt="Image"/>
      <h3>${dramaName}</h3>
      <a href="${myLink}"><button>Click Here to Watch</button></a>
    </div>
  </body>
</html>`,
        });
      }
      browser.close();
      setTimeout(checkWebsite, 1000 * 60);
    } catch (err) {
      console.log(err.message);
      checkWebsite();
    }
  } else {
    setTimeout(checkWebsite, 1000 * 60 * 60);
  }
};

checkWebsite();

app.listen(port, () => console.log(`Server is listening on port ${port}`));
