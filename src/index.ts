//alt1 base libs, provides all the commonly used methods for image matching and capture
//also gives your editor info about the window.alt1 api
import * as a1lib from "@alt1/base";
import { ImgRef, ImgRefBind, ImgRefData } from "@alt1/base";
import ChatBoxReader, * as a1chat from "@alt1/chatbox";

//tell webpack to add index.html and appconfig.json to output
require("!file-loader?name=[name].[ext]!./index.html");
require("!file-loader?name=[name].[ext]!./appconfig.json");


var output = document.getElementById("output");

//loads all images as raw pixel data async, images have to be saved as *.data.png
//this also takes care of metadata headers in the image that make browser load the image
//with slightly wrong colors
//this function is async, so you cant acccess the images instantly but generally takes <20ms
//use `await imgs.promise` if you want to use the images as soon as they are loaded
var imgs = a1lib.ImageDetect.webpackImages({
    homeport: require("./homebutton.data.png"),
    gameMessages_filtered: require('./messages.filtered.data.png'),
    gameMessages_all: require('./messages.all.data.png')
});
//listen for pasted (ctrl-v) images, usually used in the browser version of an app

a1lib.on('alt1pressed', console.log);
//You can reach exports on window.TEST because of
//config.makeUmd("testpackage", "TEST"); in webpack.config.ts
export function capture() {
    if (!window.alt1) {
        output.insertAdjacentHTML("beforeend", `<div>You need to run this page in alt1 to capture the screen</div>`);
        return;
    }
    if (!alt1.permissionPixel) {
        output.insertAdjacentHTML("beforeend", `<div>Page is not installed as app or capture permission is not enabled</div>`);
        return;
    }
    var img = a1lib.captureHoldFullRs();
    // findHomeport(img);
}

function findHomeport(img: ImgRef) {
    var loc = img.findSubimage(imgs.homeport);
    output.insertAdjacentHTML("beforeend", `<div>homeport matches: ${JSON.stringify(loc)}</div>`);

    //overlay the result on screen if running in alt1
    if (window.alt1) {
        if (loc.length != 0) {
            alt1.overLayRect(a1lib.mixColor(255, 255, 255), loc[0].x, loc[0].y, imgs.homeport.width, imgs.homeport.height, 2000, 3);
        } else {
            alt1.overLayTextEx("Couldn't find homeport button", a1lib.mixColor(255, 255, 255), 20, Math.round(alt1.rsWidth / 2), 200, 2000, "", true, true);
        }
    }

    //get raw pixels of image and show on screen (used mostly for debug)
    var buf = img.toData(100, 100, 200, 200);
    buf.show();
}

a1lib.PasteInput.listen(img => {


    // findHomeport(img);
    // findChatBounds(img);
}, (err, errid) => {
    output.insertAdjacentHTML("beforeend", `<div><b>${errid}</b>  ${err}</div>`);
});
console.log(localStorage.getItem('hello'));
localStorage.setItem('hello', JSON.stringify({ hi: 'resp' }));

const ocr = new ChatBoxReader();
//on load, potentially set new available and start?
const safeLocations: ({ location: string, note: string, available: number, start: number; })[] = JSON.parse(localStorage.getItem('safeLocations')) || [];
let index = Number(localStorage.getItem('currentIdx')) || 0;
const redraw = () => {
    const progressList = document.getElementById('progress_list');

    if (progressList) {
        progressList.innerHTML = safeLocations.reduce((acc, next, idx) => {
            const currentValue = Date.now() - next.start;
            const max = next.available - next.start;
            const secondsLeft = currentValue > max ? 0 : (max - currentValue) / 1000;
            console.log(currentValue, max, next);
            acc += `
            <li
                id="location-${idx}"
                style="display:flex;flex-direction: column;padding-left: 0; margin-left: 0;"
            >
                <div
                    style="display: flex;justify-content: space-between;align-items: center;padding-bottom: 4px;"
                >
                    <div>
                        <label class="nistext" id="location-label-${idx}">${next.location}</label>
                        <label id="location-arrow-${idx}" style="color: green;display: ${idx === index ? 'inline-block' : 'none'};">←</label>
                    </div>
                    <div>
                        <button
                            onclick="TEST.setCurrent(${idx})"
                        >Set</button>
                        <button
                            onclick="TEST.manualTriggerSafe(${idx})"
                        >Trigger</button>
                        <button
                            onclick="TEST.deleteSafeLocation(${idx})"
                        >Delete</button>
                    </div>
                </div>
                <input id="note-${idx}" class="nisinput" placeholder="Add a note" value="${next.note || ""}" onchange="TEST.changeNoteFor(${idx}, this.value)"></input>
                <div>
                    <progress id="progress-${idx}" value="${currentValue}" max="${max}"></progress>
                    <label id="progress-label-${idx}">${Math.ceil(secondsLeft)} seconds left</label>
                </div>
            </li>
            `;
            return acc;
        }, '');
    }
};
export const setCurrent = (idx: number) => {
    index = idx;
};
export const manualTriggerSafe = (idx: number) => {
    safeLocations[idx].available = safeLocations[idx].start;
};
export const deleteSafeLocation = (idx: number) => {
    safeLocations.splice(idx, 1);
    redraw();
};
export const changeNoteFor = (idx: number, text: string) => {
    console.log(idx, text);
    safeLocations[idx].note = text;
    const currentNote = document.getElementById(`progress-label-${idx}`) as HTMLInputElement;
    currentNote.value = text;
};
const t = setInterval(function () {
    if (window.alt1) {
        let pos = ocr.find();
        if (pos) {
            let state = ocr.read();
            // chatHistory.push(state.);
            if (state) {
                let fullLines = state.reduce((acc, next) => {
                    if (/^\[[0-9][0-9]:[0-9][0-9]:[0-9][0-9]\]/.test(next.text)) {
                        acc.push(next.text);
                    } else {
                        acc[acc.length - 1] += ` ${next.text}`;
                    }

                    return acc;
                }, []);

                fullLines.forEach(line => {
                    console.log(/^\[[0-9][0-9]:[0-9][0-9]:[0-9][0-9]\] You crack open the safe!/.test(line), line);
                    if (/^\[[0-9][0-9]:[0-9][0-9]:[0-9][0-9]\] You crack open the safe!/.test(line)) {
                        const now = Date.now();
                        safeLocations[index].available = now + (safeLocations[index].location === `Zemouregal's Fortress` ? 1000 * 60 * 10 : 1000 * 60 * 5);
                        safeLocations[index].start = now;
                        index++;

                        if (index >= safeLocations.length) {
                            index = 0;
                        }
                    }
                });
            }
        }
    }

    safeLocations.forEach((loc, idx) => {
        const currentProgress = document.getElementById(`progress-${idx}`) as HTMLProgressElement;
        const currentProgressLabel = document.getElementById(`progress-label-${idx}`) as HTMLLabelElement;
        const currentLabelArrow = document.getElementById(`location-arrow-${idx}`) as HTMLLabelElement;

        currentLabelArrow.style.display = idx === index ? 'inline-block' : 'none';

        const currentValue = Date.now() - safeLocations[idx].start;
        const max = safeLocations[idx].available - safeLocations[idx].start;
        const secondsLeft = currentValue > max ? 0 : (max - currentValue) / 1000;

        currentProgress.value = currentValue;
        currentProgress.max = max;

        currentProgressLabel.innerText = `${Math.ceil(secondsLeft)} seconds left`;
    });

    // redraw();

    // if (coords.topLeft.x !== 0 && coords.topLeft.y !== 0 && coords.bottomRight.x !== 0 && coords.bottomRight.y !== 0) {
    //     var img = a1lib.captureHoldFullRs();
    //     const chat = img.read(coords.topLeft.x, coords.topLeft.y, coords.bottomRight.x - coords.topLeft.x, coords.bottomRight.y - coords.topLeft.y);
    //     const text = ocr.read(new ImgRefData(chat));
    //     console.log(text);
    //     output.insertAdjacentHTML("beforeend", `<div>${text}</div>`);
    //     // console.log('nice');
    //     // chat.show();
    // }
    localStorage.setItem('safeLocations', JSON.stringify(safeLocations));
    localStorage.setItem('currentIdx', JSON.stringify(index));
}, 1000);

setTimeout(() => {

    redraw();
}, 1000);

export const AddSafe = () => {
    const selector = document.getElementById('safe_location') as HTMLSelectElement;
    safeLocations.push({
        location: selector.value,
        note: '',
        available: Date.now(),
        start: Date.now()
    });
    redraw();
};

// function findChatBounds(img: ImgRef) {
//     var locations = [
//         ...img.findSubimage(imgs.gameMessages_filtered),
//         ...img.findSubimage(imgs.gameMessages_all)
//     ];

//     output.insertAdjacentHTML("beforeend", `<div>homeport matches: ${JSON.stringify(locations)}</div>`);

//     //overlay the result on screen if running in alt1
//     if (window.alt1) {
//         if (locations.length != 0) {
//             alt1.overLayRect(a1lib.mixColor(255, 255, 255), locations[0].x, locations[0].y, imgs.homeport.width, imgs.homeport.height, 2000, 3);
//         } else {
//             alt1.overLayTextEx("Couldn't find homeport button", a1lib.mixColor(255, 255, 255), 20, Math.round(alt1.rsWidth / 2), 200, 2000, "", true, true);
//         }
//     }

//     console.log(locations);
//     console.log(img);
// }

//print text world
//also the worst possible example of how to use global exposed exports as described in webpack.config.json

// output.insertAdjacentHTML("beforeend", `
// 	<div>paste an image of rs with homeport button (or not)</div>
// 	<div onclick='TEST.capture()'>Click to capture if on alt1</div>`
// );

//check if we are running inside alt1 by checking if the alt1 global exists
if (window.alt1) {
    //tell alt1 about the app
    //this makes alt1 show the add app button when running inside the embedded browser
    //also updates app settings if they are changed
    alt1.identifyAppUrl("./appconfig.json");
}
