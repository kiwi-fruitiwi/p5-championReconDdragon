/**
 @author kiwi
 @date 2022.07.14

 before a league of legends match starts, it'd be nice to see a list of
 opposing champion abilities and videos all in one place. the official league
 of legends champion pages require clicking, while mobaFire and op.gg lack
 videos

 what roles does this champion play? champion type: battlemage, support, etc

 data we want to display
    PQWER data laid out in grid or column, each with video
    ally and enemy tips
    blurb + longDesc
    optional: league wiki

 league wiki data is stored via JSON using this project:
    github.com/meraki-analytics/lolstaticdata
    locally stored now as fandom-champions.json
    includes all wiki info, including champion types and AP/AD scaling!

    relevant links
        root → http://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/
        champions.json
        champions/Cassiopeia.json  (indexed by champion key, found in ddragon)
        items/3001.json  (indexed by item id, found in ddragon)
        items.json

 ☐ log basic info
    +stats
 ☒ output abilities and tips
 ☒ output champion image
 ☒ output passive image
 ☒ output 4 ability images
 ☒ add random video as canvas element
 ☒ change 'selectedChampion' to 'sc'
 ☒ create '0000' string padding function
 ☒ load R video for selected champion on mousePress

 ☒ add videos per ability
 ☒ PQWER all load a video: the current one
 ☒ load ability names with video
 ☒ load ability descriptions with video :D

 ☒ scrap plans to load from cdn.merakianalytics; download manually instead
    ☒ httpGet and loadJSON don't work with either json or jsonp specified

 ☐ switch champions with numpad +/- one and ten. debug log number
 ☐ look up using the DOM with daniel
 ☐ visualize stats like AD growth or armor growth. comparison to other champions
    → done with lolstaticdata from meraki-analytics on GitHub
        this uses data from league wiki
 */

let font
let instructions
let debugCorner /* output debug text in the bottom left corner of the canvas */

const rootURI = 'https://ddragon.leagueoflegends.com/cdn/12.13.1/'
const rootLangURI = rootURI + 'data/en_US/'
const allChampionsPath = 'champion.json'
const videoURI = 'https://d28xe8vt774jo5.cloudfront.net/champion-abilities/'

let championsJSON

/* 'sc' stands for 'selectedChampion' */
let scJsonURI /* loaded after setup */
let scID /* id of champion after loading specific champion json */
let scKey /* 4 digit 0-padded key of selected champion, e.g. Ahri is '0103' */
let scImg
let scImgP /* passive ability image */
let scImgQ
let scImgW
let scImgE
let scImgR

let scVideo
let abilityKey /* stores one of PQWER to load our selected champion's video */

/* the value of the key 'data' in the specific champion json */
let scDataJSON

/* json champion data from meraki-analytics project: lolstaticdata */
const lsdRoot = 'http://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions/'
let scLsdJSON

let n /* number of champions */

function preload() {
    font = loadFont('data/consola.ttf')
    let req = rootLangURI + allChampionsPath
    championsJSON = loadJSON(req)


    const scLsdJsonURI = `${lsdRoot}Blitzcrank.json`
    console.log(scLsdJsonURI)

    /* this runs into a CORB error */
    // loadJSON(scLsdJsonURI, gotLolStaticData, 'jsonp')
}


function displayDefaultInstructions() {
    instructions.html(`<pre>
        → use [PQWER] to display passive or QWER abilities. 
        → numpad 1 → noLoop</pre>`)
}


function setup() {
    let cnv = createCanvas(600, 450)
    cnv.parent('#canvas')

    imageMode(CENTER)
    colorMode(HSB, 360, 100, 100, 100)
    textFont(font, 14)

    /* initialize instruction div */
    instructions = select('#ins')
    displayDefaultInstructions()

    debugCorner = new CanvasDebugCorner(5)

    /* how many total champions are there? */
    n = Object.keys(championsJSON['data']).length

    processChampionsJSON()
    // logChampionNames()

    scID = getRandomChampionID()
    scKey = championsJSON['data'][scID]['key']
    scKey = scKey.padStart(4, '0') /* leading zeros necessary for video URI */

    scJsonURI = `${rootLangURI}champion/${scID}.json`
    loadJSON(scJsonURI, gotChampionData)

    /* we always get a CORS error when we try this request
        problem solving: https://github.com/processing/p5.js/wiki/Local-server

        solution: keep a local copy but download each time
     */
    // const scLsdJsonURI = `${lsdRoot}${scID}.json`
    // console.log(scLsdJsonURI)
    // loadJSON(scLsdJsonURI, gotLolStaticData)
}


/** fill local data! champions.JSON will have finished loading in preload() */
function processChampionsJSON() {
    console.log(`[ INFO ] loaded ${n} champions.json from ddragon.leagueoflegends`)
}


function gotChampionData(data) {
    const d = data['data']
    scDataJSON = d
    
    processSelectedChampion()
}


/* get champion data from meraki-analytics project, lolStaticData */
function gotLolStaticData(data) {
    scLsdJSON = data

    processLolStaticChampionData()
}


/* concurrent processing with processSelectedChampion for now
    goal is to convert psc to this method instead
 */
function processLolStaticChampionData() {
    console.log(`[ INFO ] process lolstaticdata!`)
    console.log(`process wiki json → ${scID}`)
    console.log(scLsdJSON[scID])
}


/** logs specific champion data
    needs loadJSON of champion-specific data to happen first
        → scDataJSON

    "type": "champion",
    "format": "standAloneComplex",
    "version": "12.12.1",
    "data": {
        "Quinn": {
            "id": "Quinn",
            "key": "133",
            "name": "Quinn",
            "title": "Demacia's Wings",
            "image": {},
            "skins": [],
            "lore": "",
            "blurb": "",
            "allytips": [],
            "enemytips": [],
            "tags": [],
            "partype": "Mana",
            "info": {},
            "stats": {},
            "spells": [],
            "passive": {},
            "recommended": []
        }
    }
 */
function processSelectedChampion() {
    console.log(`[ INFO ] processing selected champion: ${scID}`)

    logChampionAbilities()
    logChampionTips()
    setChampionImages()

    /* load locally for now */
    loadJSON('champions.json', gotLolStaticData)
}



/** requires scDataJSON to be loaded */
function logChampionAbilities() {
    const data = scDataJSON[scID]

    console.log(`[ LOG ] ${scID}'s passive ability:`)
    console.log(data['passive'])
    // console.log(data['spells'])

    /* log the names of the selected champion's 4 abilities */
    const spellNumber = Object.keys(data['spells']).length

    console.log(`[ LOG ] ${scID}'s active abilities:`)
    const spells = data['spells']
    for (const spell of spells) {
        console.log(`${spell['id']}: ${spell['name']}`)
    }
}


/** requires scDataJSON to be loaded */
function logChampionTips() {
    const data = scDataJSON[scID]

    /* log ally tips */
    console.log(`[ LOG ] ${scID}'s ally tips:`)
    console.log(data['allytips'])

    console.log(`[ LOG ] ${scID}'s enemy tips:`)
    console.log(data['enemytips'])
}


/** creates tooltip text using ability data */
function logAbilityTooltip(tooltipData) {


    /*
        "tooltip": "Sejuani throws her True Ice bola, <status>Stunning</status>
        and revealing the first enemy champion hit for {{ e2 }} second and
        dealing <magicDamage>{{ minordamagetooltip }} magic
        damage</magicDamage> .<br /><br />If the bola travels at least 25%
        of its range, it <status>Stuns</status> and reveals for {{ e6 }}
        seconds instead. It then also creates an ice storm that
        <status>Slows</status> surrounding enemies by {{ e4 }}% for {{ e3 }}
        seconds. All affected enemies take <magicDamage>{{
        totaldamagetooltip }} magic damage</magicDamage>.
        {{ spellmodifierdescriptionappend }}",
     */

}


function setAbilityVideo(key) {
    const data = scDataJSON[scID]
    const spells = data['spells']
    let abilityName
    let tooltip
    let description

    /* QWER correspond to characters 0123, but P is different! */
    const dict = {
        'Q': 0,
        'W': 1,
        'E': 2,
        'R': 3,
    }

    const abilityID = dict[key]

    if (key === 'P') {
        abilityName = data['passive']['name']
        description = data['passive']['description']
        /* todo → do passives have tooltips? */
    } else { /* key must be Q W E R */
        abilityName = spells[abilityID]['name']
        description = spells[abilityID]['description']
        tooltip = spells[abilityID]['tooltip']
        console.log(tooltip)
    }

    debugCorner.setText(`» ${scID} → ${key}: ${abilityName}`, 0)
    displayDefaultInstructions()

    /* append with 'true' */
    instructions.html(`${key}: ${abilityName} → ${description}`, true)
    instructions.html('<br><br>' + tooltip, true)

    /*
    video links for abilities look like this!

        https://d28xe8vt774jo5.cloudfront.net/champion-abilities/
        0103/ability_0103_P1.webm
     */

    const uri = `${videoURI}${scKey}/ability_${scKey}_${key}1.webm`
    scVideo = createVideo(uri)

    /*  by default video shows up in separate DOM element. hide it and draw
        it to the canvas instead */
    scVideo.hide()
    scVideo.play()
}


function setChampionImages() {
    /* set champion image. example:
        https://ddragon.leagueoflegends.com/cdn/12.12.1/img/champion/Nunu.png

        → rootURI + 'img/champion/ID'
     */
    const imgPath = rootURI + 'img/champion/' + scID + '.png'
    scImg = loadImage(imgPath)

    /* set champion passive image
        https://ddragon.leagueoflegends.com/cdn/12.12.1/img/passive/Ahri_SoulEater2.png

        → rootURI + 'img/passive/' + data['passive']['image']['full']
     */
    const data = scDataJSON[scID]
    const passiveURI = data['passive']['image']['full']
    const passivePath = rootURI + 'img/passive/' + passiveURI;
    scImgP = loadImage(passivePath)

    /* set champion ability images
        https://ddragon.leagueoflegends.com/cdn/12.12.1/img/spell/AhriSeduce.png
        → rootURI + 'img/spell/' + data['spells'][n]['image']['full]
     */
    scImgQ = loadImage(
        rootURI + 'img/spell/' + data['spells']['0']['image']['full'])
    scImgW = loadImage(
        rootURI + 'img/spell/' + data['spells']['1']['image']['full'])
    scImgE = loadImage(
        rootURI + 'img/spell/' + data['spells']['2']['image']['full'])
    scImgR = loadImage(
        rootURI + 'img/spell/' + data['spells']['3']['image']['full'])
}


/** returns ID of random champion selected from championsJSON
    → note that ID differs from name: Nunu's name is Nunu & Willump
 */
function getRandomChampionID() {
    const randomHeroIndex = int(random(0, n))
    const randomChampion = Object.keys(championsJSON['data'])[randomHeroIndex]
    return randomChampion
}


/** logs all champion names in the console */
function logChampionNames() {
    /*
        "type": "champion",
        "format": "standAloneComplex",
        "version": "12.12.1",
        "data": {
            "Nunu": {"id": "Nunu", "name": "Nunu & Willump", etc.},
            ...
        }
    */

    const data = championsJSON['data']
    const numChampions = Object.keys(data).length
    console.log(`[ INFO ] logging all ${numChampions} champion names`)

    for (const i in data) {
        console.log(data[i]['name'])
    }
}


function draw() {
    background(234, 34, 24)

    /* debugCorner needs to be last so its z-index is highest */
    debugCorner.setText(`frameCount: ${frameCount}`, 2)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 1)
    debugCorner.show()

    const H = height/6

    if (scImg)
        image(scImg, width/2 - 200, H)

    if (scImgP)
        image(scImgP, width/2 - 80, H)

    if (scImgQ)
        image(scImgQ, width/2, H)

    if (scImgW)
        image(scImgW, width/2 + 70, H)

    if (scImgE)
        image(scImgE, width/2 + 140, H)

    if (scImgR)
        image(scImgR, width/2 + 210, H)

    /* ability videos: default size 1056, 720 */
    if (scVideo) {
        // console.log(scVideo)
        const SF = 0.33
        image(scVideo, width/2+65, height/2+20, SF*1056, SF*720)
    }

    if (frameCount > 3000)
        noLoop()
}


function keyPressed() {
    /* stop sketch */
    if (keyCode === 97) { /* numpad 1 */
        noLoop()
        instructions.html(`<pre>
            sketch stopped</pre>`)
    }

    /* if key is PQWER, load selectedChampionVideo! maybe set abilityKey */
    if (key === 'p' || key === '1') {
        setAbilityVideo('P')
    }

    if (key === 'q') {
        setAbilityVideo('Q')
    }

    if (key === 'w') {
        setAbilityVideo('W')
    }

    if (key === 'e') {
        setAbilityVideo('E')
    }

    if (key === 'r') {
        setAbilityVideo('R')
    }
}


function mousePressed() {
    // console.log(`mouse pressed → ${scID}`)
}


/** 🧹 shows debugging info using text() 🧹 */
class CanvasDebugCorner {
    constructor(lines) {
        this.size = lines
        this.debugMsgList = [] /* initialize all elements to empty string */
        for (let i in lines)
            this.debugMsgList[i] = ''
    }

    setText(text, index) {
        if (index >= this.size) {
            this.debugMsgList[0] = `${index} ← index>${this.size} not supported`
        } else this.debugMsgList[index] = text
    }

    show() {
        textFont(font, 14)

        const LEFT_MARGIN = 10
        const DEBUG_Y_OFFSET = height - 10 /* floor of debug corner */
        const LINE_SPACING = 2
        const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING

        /* semi-transparent background */
        fill(0, 0, 0, 10)
        rectMode(CORNERS)
        const TOP_PADDING = 3 /* extra padding on top of the 1st line */
        rect(
            0,
            height,
            width,
            DEBUG_Y_OFFSET - LINE_HEIGHT*this.debugMsgList.length - TOP_PADDING
        )

        fill(0, 0, 100, 100) /* white */
        strokeWeight(0)

        for (let index in this.debugMsgList) {
            const msg = this.debugMsgList[index]
            text(msg, LEFT_MARGIN, DEBUG_Y_OFFSET - LINE_HEIGHT * index)
        }
    }
}