const puppeteer = require('puppeteer');
const crawler = require('./crawler');
const broadcast = require('./broadcast');
require('dotenv').config();

const args = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-infobars',
  '--window-position=0,0',
  '--ignore-certifcate-errors',
  '--ignore-certifcate-errors-spki-list',
  '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
];

const options = {
  args,
  headless: true,
  ignoreHTTPSErrors: true,
  //   userDataDir: "./tmp",
  ignoreDefaultArgs: ['--enable-automation'],
};

const url = process.env.RE_URL;

module.exports = {
  async main({ searchKey, type, min, max, clients }) {
    let properties;
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();

    //add request interception
    await page.setRequestInterception(true);
    page.on('request', (interceptedRequest) => {
      if (
        interceptedRequest.url().endsWith('.gif') ||
        interceptedRequest.url().endsWith('.png') ||
        interceptedRequest.url().endsWith('.jpg') ||
        interceptedRequest.resourceType() == 'image' ||
        interceptedRequest.resourceType() == 'font' ||
        interceptedRequest.resourceType() == 'media'
      )
        interceptedRequest.abort();
      else interceptedRequest.continue();
    });
    await page.goto(url, { waitUntil: 'networkidle2' });

    // select suburb with suburb name and state
    await setSuburb(page, searchKey, clients);

    //select property type
    await setPropertyType(page, type);

    //set search range
    await setSearchRange(page, min, max);

    // unselect 'including surrounding suburbs'
    await selectSurrounding(page);

    // const propertyTypeLabelHandlers = await page.$x(
    //   "//label[contains(text(), 'Property type')]"
    // );

    // search property after setting
    // await  page.click(".rui-grid-advanced a") 执行会有问题
    await Promise.all([
      page.click('.rui-grid-advanced a'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    // await page.screenshot({ path: 'example.png' });
    properties = await listPageCrawl(page, clients);
    await browser.close();
    return properties.map((item) => {
      return {
        ...item,
        hiddenPrice: Number(max.replace('$', '').replace(/\,/g, '')),
      };
    });
  },
};

//set property type
const setPropertyType = async (page, value = 0) => {
  const propertyTypes = ['House', 'Apartment & Unit'];
  try {
    await page.click(
      '.search-form-layout .search-form-layout__item .Select.Select--multi'
    );
    await page.waitForSelector('.Select-menu-outer .Select-menu', {
      timeout: 10 * 1000,
    });
    await page.click(`div[aria-label='${propertyTypes[value]}']`);
  } catch (error) {
    console.error(error);
  }
};

// select suburb with suburb name and state
const setSuburb = async (page, searchKey, clients) => {
  try {
    //postcode crawl
    if (!searchKey) return;
    console.log(searchKey);
    broadcast.broadcast(clients, searchKey);
    await page.type('.Select.is-clearable.is-searchable input', searchKey);
    await page.waitForSelector('.Select-menu-outer .Select-menu', {
      timeout: 20 * 1000,
    });
    //format msg
    const propertyNumMsg = await page.$eval(
      '.Select-menu-outer .Select-menu .is-focused',
      (el) => {
        return el.innerHTML;
      }
    );
    console.log(propertyNumMsg);
    broadcast.broadcast(clients, propertyNumMsg);

    await page.click('.Select-menu-outer .Select-menu .is-focused');
  } catch (error) {
    console.error(error);
    await page.type(
      '.Select.is-clearable.is-searchable input',
      'carindale qld'
    );
    await page.waitForSelector('.Select-menu-outer .Select-menu', {
      timeout: 20 * 1000,
    });
    await page.click('.Select-menu-outer .Select-menu:first-child');
  }
};

// unselect 'including surrounding suburbs'
const selectSurrounding = async (page, willSelectSurrounding = false) => {
  try {
    if (!willSelectSurrounding)
      await page.click("label[for='surroundingSuburbs']");
  } catch (error) {
    console.error(error);
  }
};

// set search range
const setSearchRange = async (page, min, max) => {
  try {
    if (!min || !max) throw error;
    const minNum = Number(min.replace('$', '').replace(/\,/g, ''));
    const maxNum = Number(max.replace('$', '').replace(/\,/g, ''));
    if (minNum > maxNum)
      throw 'search range set error, max should be bigger than min';
    if (minNum == 0 && maxNum == 0) return;

    await page.click('.Select.min.has-value');
    await page.waitForSelector('.Select-menu-outer .Select-menu', {
      timeout: 20 * 1000,
    });
    await page.click(`div[aria-label='${min}']`);

    await page.click('.Select.max.has-value');
    await page.waitForSelector('.Select-menu-outer .Select-menu', {
      timeout: 20 * 1000,
    });
    await page.click(`div[aria-label='${max}']`);
  } catch (error) {
    console.error(error);
  }
};

const listPageCrawl = async (page, clients) => {
  const properties = [];
  try {
    const tipBtnClose = await page.$('.digital-inspections-element-close');
    if (tipBtnClose) await tipBtnClose.click();
    let hasNext;
    let pageChangeFlag = '';

    do {
      try {
        //list页面切换逻辑不同，应该是因为单页应用或者graphql原因, page.waitForNavigation({ waitUntil: "networkidle0" }),无效
        //切换页面也许会造成.results-heading+div暂时失效，报错
        //错误:Node is either not visible or not an HTMLElement 多数是这里的问题
        const newPageSummary = await page.$eval(
          '.results-heading+div',
          (el) => {
            return el.innerHTML;
          }
        );
        if (newPageSummary != pageChangeFlag) {
          const content = await page.content();
          const propertyByPage = await crawler.crawl(content);
          properties.push(...propertyByPage);
          pageChangeFlag = newPageSummary;
          //每页房屋数和总数, 例如 "1-20 of 30 results"
          const msg = newPageSummary;
          console.log(msg);
          broadcast.broadcast(clients, msg);
        }
        hasNext = await page.$("a[rel='next']");

        if (hasNext) {
          await Promise.all([
            page.click("a[rel='next']"),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
          ]);
        }
      } catch (error) {
        console.error(error);
      }
    } while (hasNext);
  } catch (error) {
    console.error(error);
    broadcast.broadcast(clients, error);
  } finally {
    return properties;
  }
};
