const puppeteer = require('puppeteer');
const fs = require('fs');
browser = null;
baseUrl = "https://music.163.com/#/album?id=";
song = [];
songs = [];

//打开新页面
async function openNewPage(url){
  var page = await browser.newPage();
  await page.goto(url, {waitUntil:"domcontentloaded",timeout:0});
  return page;
}
//抓取入口
async function init(){
  //browser = await puppeteer.launch();
  browser = await puppeteer.launch({headless:false});
  await getListPage();
}

async function getListPage(){
    var url = baseUrl + "1489703";
    await openNewPage(url).then(page=>{
        page.on('response', intercepter);
        page.on('console', consoleMsg);
        page.evaluate(injectListpage);
    })
    .catch(function(e){
        console.log(e);
    })
}
//拦截请求 https://pptr.dev/#?product=Puppeteer&version=v1.14.0&show=api-class-response
async function intercepter(resp){
    var url = resp.url();
    //console.log(url);
    if(url.indexOf("/weapi/song/enhance/player/url/v1")<0) return;

    await resp.json().then(jsonres =>{
        console.log(jsonres);
        if(typeof(song[1] == 'undefined')){
            song[1] = jsonres.data[0].url;
            songs.push(song);
        }
        song = [];
        console.log(songs);
    }).catch(e=>{
        console.log('err json');
    })
}
//拦截console请求 为了与页内通信
function consoleMsg(msg){
    if(msg.text().indexOf("songmenu:")<0) return;
    //console.log(msg.text());
    song[0] = msg.text();
}
//注入到列表页内的方法
//遍历列表 & 点击 &拿到下载地址
async function injectListpage(){
    var iframeDocument = window.parent.document.getElementById("g_iframe").contentWindow.document;
    var trs = iframeDocument.querySelectorAll(".m-table > tbody > tr");
    for(tr in trs){
        if(trs[tr] == null || trs[tr] == undefined) continue;
        if(typeof(trs[tr].querySelector) != 'function') continue;
        var onesong = trs[tr].querySelector(".left>div>.ply");
        console.log(onesong);
        var title = trs[tr].querySelector("b").getAttribute("title");
        console.log("songmenu:"+title);

        await new Promise((resolve)=>{
            setTimeout(()=>{
                onesong.click();
                resolve();
            }, 5000);//默认等待5s在下载下一首
        })
    }
}

init();