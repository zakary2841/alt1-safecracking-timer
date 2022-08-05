//alt1 base libs, provides all the commonly used methods for image matching and capture
//also gives your editor info about the window.alt1 api
import * as a1lib from "@alt1/base";
import { ImgRef, ImgRefBind, ImgRefData, mixColor } from "@alt1/base";
import ChatBoxReader, * as a1chat from "@alt1/chatbox";
import tooltip from '@alt1/tooltip';

//tell webpack to add index.html and appconfig.json to output
require("!file-loader?name=[name].[ext]!./index.html");
require("!file-loader?name=[name].[ext]!./appconfig.json");


let useTooltip = (!!localStorage.getItem('useTooltip') && localStorage.getItem('useTooltip') === 'false') ? false : alt1.permissionOverlay;
let toggle = <HTMLInputElement>document.getElementById('tooltip_toggle');
if (useTooltip) toggle.setAttribute('checked', 'checked'); else toggle.removeAttribute('checked');
toggle.addEventListener('change', (event) => {
    localStorage.setItem('useTooltip', !useTooltip == true ? 'true' : 'false');
    if (useTooltip) toggle.setAttribute('checked', 'checked'); else toggle.removeAttribute('checked');
});


var output = document.getElementById("output");

const ocr = new ChatBoxReader();
//on load, potentially set new available and start?
const safeLocations: ({ location: string, note: string, available: number, start: number; })[] = JSON.parse(localStorage.getItem('safeLocations')) || [];
let index = Number(localStorage.getItem('currentIdx')) || 0;

let tooltipOpen = false;
setInterval(() => {

    const current = safeLocations.map(entry => {
        const currentValue = Date.now() - entry.start;
        const max = entry.available - entry.start;
        const secondsLeft = currentValue > max ? 0 : (max - currentValue) / 1000;
        return ({ ...entry, currentValue, max, secondsLeft });
    }).filter(entry => entry.secondsLeft == 0);

    if (useTooltip) {
        if (current.length > 0) {
            alt1.setTooltip(`${current.map(entry => `[(${entry.location}): ${entry.note}]`).join(', ')} are ready to be cracked again`);
            tooltipOpen = true;
        } else {
            if (tooltipOpen) {
                alt1.clearTooltip();
            }
            tooltipOpen = false;
        }
    } else {
        if (tooltipOpen) {
            alt1.clearTooltip();
        }
        tooltipOpen = false;
    }
}, 1000);
const redraw = () => {
    console.log('asdgasfgsfdd', alt1.mousePosition);
    const progressList = document.getElementById('progress_list');

    if (progressList) {
        progressList.innerHTML = safeLocations.reduce((acc, next, idx) => {
            const currentValue = Date.now() - next.start;
            const max = next.available - next.start;
            const secondsLeft = currentValue > max ? 0 : (max - currentValue) / 1000;
            // console.log(currentValue, max, next);
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
    // console.log(idx, text);
    safeLocations[idx].note = text;
    const currentNote = document.getElementById(`progress-label-${idx}`) as HTMLInputElement;
    currentNote.value = text;
};

let lastConsumedLine: string = localStorage.getItem('lastConsumedLine') || '';

const t = setInterval(function () {
    try {
        if (window.alt1) {
            let pos = ocr.find();
            if (pos) {
                let state = ocr.read();
                // console.log(state);
                if (state) {
                    state.forEach(line => {
                        // console.log(line.text);
                        if (line.text.includes('You crack open the safe!')) {
                            let now = (new Date()).valueOf();
                            // console.log(`New start: ${now} | New End: ${now + (safeLocations[index]?.location === `Zemouregal's Fortress` ? 1000 * 60 * 10 : 1000 * 60 * 5)} | safe: ${JSON.stringify(safeLocations[index], null, '\t')}`);
                            safeLocations[index].available = now + (safeLocations[index]?.location === `Zemouregal's Fortress` ? 1000 * 60 * 10 : 1000 * 60 * 5);
                            safeLocations[index].start = now;
                            index++;

                            if (index >= safeLocations.length) {
                                index = 0;
                            }
                            lastConsumedLine = line.text;
                        }
                    });
                }
            }
        }

        safeLocations.forEach((loc, idx) => {
            // console.log(idx);
            const currentProgress = document.getElementById(`progress-${idx}`) as HTMLProgressElement;
            const currentProgressLabel = document.getElementById(`progress-label-${idx}`) as HTMLLabelElement;
            const currentLabelArrow = document.getElementById(`location-arrow-${idx}`) as HTMLLabelElement;

            if (currentLabelArrow) {
                currentLabelArrow.style.display = idx === index ? 'inline-block' : 'none';
            }

            const currentValue = Date.now() - safeLocations[idx].start;
            const max = safeLocations[idx].available - safeLocations[idx].start;
            const secondsLeft = currentValue > max ? 0 : (max - currentValue) / 1000;

            if (currentProgress) {
                currentProgress.value = currentValue;
                currentProgress.max = max;
            }

            if (currentProgressLabel) {
                currentProgressLabel.innerText = `${Math.ceil(secondsLeft)} seconds left`;
            }
            // console.log('finished safes');
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
        localStorage.setItem('lastConsumedLine', lastConsumedLine);
        // console.log('finished');
    } catch (ex) {
        console.error(ex);
    }
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

export const Start = () => {
    for (let index = 0; index < safeLocations.length; index++) {
        let now = (new Date()).valueOf();
        console.log(`New start: ${now} | New End: ${now + (safeLocations[index]?.location === `Zemouregal's Fortress` ? 1000 * 60 * 10 : 1000 * 60 * 5)} | safe: ${JSON.stringify(safeLocations[index], null, '\t')}`);
        safeLocations[index].available = now + (safeLocations[index]?.location === `Zemouregal's Fortress` ? 1000 * 60 * 10 : 1000 * 60 * 5);
        safeLocations[index].start = now;
    }
};

//check if we are running inside alt1 by checking if the alt1 global exists
if (window.alt1) {
    //tell alt1 about the app
    //this makes alt1 show the add app button when running inside the embedded browser
    //also updates app settings if they are changed
    alt1.identifyAppUrl("./appconfig.json");
    Start();
}
