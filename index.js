import {qs, qsa} from "./util.js";
import {Canvas} from "./Canvas.js";
import {Contestant} from "./Contestant.js";
import {game, dashboard} from "./game.js";

const {floor, random, min, max} = Math;

const display = new Canvas(".display > canvas");

const displaySettings = {
    width: NaN,
    height: NaN,
};

const popupDisplayWindow = {
    window: null,
    display: null,

    matchSize() {
        if (!this.window) return false;

        this.window.resizeTo(
            this.window.outerWidth - this.window.innerWidth + displaySettings.width,
            this.window.outerHeight - this.window.innerHeight + displaySettings.height,
        );
        return this;
    },

    focus() {
        if (!this.window) return false;
        
        this.window.focus();
        return this;
    },

    close() {
        if (!this.window) return false;

        this.window.close();
        return this;
    },

    onunload() {
        this.window.close();
        this.window = null;
        this.display = null;
        return this;
    },
};

init();

function currentDisplay() {
    const currentDisplay = popupDisplayWindow.display || display;

    return currentDisplay;
}

function setDisplayDimensions(width, height) {
    display.size(width, height);

    [displaySettings.width, displaySettings.height] = display.size();

    popupDisplayWindow.matchSize();
}

function onizeControls() {
    iterateDependentControls(controls => { // Standby //
        qs("button[name='advance']", controls).addEventListener("click", () => {
            game.setState(dashboard.StatesDependent.LOBBY);
        });

    }, controls => { // Lobby //
        qs("button[name='add']", controls).addEventListener("click", () => {
            const textarea = qs("textarea", controls);

            for (let line of textarea.value.split("\n")) {
                if (!line) continue;
                game.addContestant(new Contestant(line));
            }
            textarea.value = "";
            dashboard.updateContestantList();
            dashboard.setAdvanceButtons();
        });

        qs("button[name='advance']", controls).addEventListener("click", () => {
            // `game.roundNumber` at this point will be -1, which evokes a special case that does not eliminate any contestants
            // Also sets state to RESPONDING
            game.advanceRound();

            // Makes it so the current prompt can no longer be deleted
            const promptBar = dashboard.getPromptBar();
            qs("button", promptBar).disabled = true;
            promptBar.classList.add("current");
        });

    }, controls => { // Responding //
        qs("button[name='advance']", controls).addEventListener("click", () => {
            game.setState(dashboard.StatesDependent.VOTING);

            game.eliminateNonResponders();
        });

    }, controls => { // Voting //
        qs("button[name='advance']", controls).addEventListener("click", () => {
            const textarea = qs("textarea", controls);
            for (let votesListByUser of textarea.value.split("\n")) {
                const votesByUser = votesListByUser.split(",").filter(text => game.voteIsParseable(text));

                if (votesByUser.length > 0) {
                    game.voters++;
                }
                for (let vote of votesByUser) {
                    game.countVote(vote, votesByUser.length);
                }
            }

            textarea.value = "";

            // debug
            let s = 0;
            for (let response of game.activeResponses) {
                s += response.averageBorda;
                console.log(response, response.averageBorda, response.percentageStandardDeviation, response.skew);
            }
            console.log(s/game.activeResponses.length)
            // end debug

            game.setState(dashboard.StatesDependent.REVEAL);
            game.eliminateContestants();
            
            dashboard.getPromptBar().classList.add("passed");
        });

    }, controls => { // Reveal //
        qs("button[name='advance']", controls).addEventListener("click", () => {
            dashboard.setAdvanceButtons();

            game.setState(dashboard.StatesDependent.LEADERBOARD);
        });

    }, controls => { // Leaderboard //
        qs("button[name='advance']", controls).addEventListener("click", () => {
            dashboard.getPromptBar().classList.remove("current");

            game.advanceRound();

            const promptBar = dashboard.getPromptBar();
            if (promptBar) {
                promptBar.classList.add("current");
            }
        });

    });

    iterateIndependentControls(controls => { // Prompt loadout
        const eliminationRateInput = qs("input[name='elimination-rate']", controls);
        eliminationRateInput.placeholder = game.contestantEliminationRatioDefault;
        eliminationRateInput.value = game.contestantEliminationRatioDefault;
        eliminationRateInput.addEventListener("change", () => {
            game.contestantEliminationRatio = eliminationRateInput.value;
        });

        qs("button[name='add-prompt']", controls).addEventListener("click", () => {
            const bar = dashboard.build.promptListing();

            qs(".prompt-list", controls).appendChild(bar);
            dashboard.updatePromptList();
        });

        qs(".prompt-list", controls).addEventListener("input", () => {
            dashboard.setAdvanceButtons();
        });
        qs(".prompt-list", controls).addEventListener("click", () => {
            dashboard.setAdvanceButtons();
        });

    }, controls => { // Contestant list
        controls.addEventListener("change", event => {
            const bar = event.path.find(element => element.tagName && element.tagName.toUpperCase() === "TR");
            if (!bar) return;

            game.contestants[bar.getAttribute("data-index")].name = event.target.value.trim();
        });

    }, controls => { // Previous results

    }, controls => { // Viewport
        qs("button[name='popup']", controls).addEventListener("click", () => {
            moveDisplayToPopup();
        });

    });

    
    qs(".dashboard > .state-dependent > button.switch-side").addEventListener("click", () => {
        dashboard.smallSwitchSide(true);
    });
    
    qs(".dashboard > .state-independent > button.switch-side").addEventListener("click", () => {
        dashboard.smallSwitchSide(false);
    });

    function iterateDependentControls(...handlers) {
        let i = 0;
        for (let page of dashboard.pagesDependent) {
            if (handlers[i]) handlers[i](page);

            qs(".dashboard > .state-dependent > .tabs").appendChild(createTab(page));
            i++;
        }
    }

    function iterateIndependentControls(...handlers) {
        let i = 0;
        for (let page of dashboard.pagesIndependent) {
            if (handlers[i]) handlers[i](page);

            qs(".dashboard > .state-independent > .tabs").appendChild(createTab(page, true));
            i++;
        }
    }

    function createTab(page, independent=false) {
        const tab = document.createElement("li");

        const state = page.getAttribute("data-state");
        const label = page.getAttribute("data-label");
        tab.setAttribute("data-state", state);
        tab.textContent = label;

        tab.addEventListener("click", () => {
            dashboard.viewPage(state, independent);
        });

        return tab;
    }
}

// Opens a popup window on which to display the graphics
function moveDisplayToPopup() {
    // If there is one already open, closes it before opening the new one
    popupDisplayWindow.close();
    const popup = open("./popupdisplay/", "", "status");

    if (!popup) {
        console.warn("Popup failed");
        return false;
    }

    popupDisplayWindow.window = popup;

    popup.addEventListener("load", () => {
        popupDisplayWindow.matchSize();

        // Creates a new canvas object to place on the new window
        const popupDisplay = new Canvas(display);
        popupDisplayWindow.display = popupDisplay;

        popup.document.body.appendChild(popupDisplay.canvas);

        display.canvas.addEventListener("click", focusPopup);

        // handles window close, attempted refresh, or attempted navigation away
        popup.addEventListener("unload", () => {
            popupDisplayWindow.onunload();

            display.canvas.removeEventListener("click", focusPopup);
        });
    });

    function focusPopup() {
        popupDisplayWindow.focus();
    }
}

const drawTimer = {
    lastTick: -Infinity,
    tick() {
        this.lastTick = Date.now();
    },
    reset() {
        this.lastTick = -Infinity;
    },
    sinceLastTick() {
        return Date.now() - this.lastTick;
    },
    get hasTicked() {
        return isFinite(drawTimer.lastTick);
    },

    // Generic overwritable object to store state-specific data
    data: {},
};

function draw() {
    currentDisplay().reset();

    if (currentDisplay() !== display) {
        display.clear()
                .cover("hsl(240, 30%, 10%)")
                .style("hsl(240, 30%, 15%)").instRect(96, display.heightHalf() - 48, display.width() - 192, 96)
                
                .style("hsl(240, 30%, 30%)")
                .font("TW Cen MT", "72px", {weight: "700"}).textAlign("center").textBaseline("middle").charSpacing("0")
                .write("Click to refocus popup");
    }

    switch (game.state) {
        default:
            console.warn(`“${game.state}” was not found as a valid game state`);
            game.setState(dashboard.StatesDependent.STANDBY);
        case dashboard.StatesDependent.STANDBY:
            currentDisplay().cover("hsl(240, 30%, 30%)")
                    .style("#fff")
                    .font("TW Cen MT", "72px", {weight: "700"}).textAlign("center").textBaseline("middle").charSpacing("16px")
                    .write("STANDBY");
            break;

        case dashboard.StatesDependent.LOBBY:
            break;

        case dashboard.StatesDependent.RESPONDING:
            break;

        case dashboard.StatesDependent.VOTING:
            if (!drawTimer.hasTicked) {
                drawTimer.data = {
                    keyword: "",
                    responses() {
                        return game.selectActiveResponses(this.keyword);
                    },
                    keywordLength: 4,
                    screenDuration: 125,
                };
            }
            if (!drawTimer.hasTicked || drawTimer.sinceLastTick() > drawTimer.data.screenDuration) {
                drawTimer.tick();
                drawTimer.data.keyword = floor(random() * 10 ** drawTimer.data.keywordLength - 1).toString().padStart(drawTimer.data.keywordLength, "0");
            }
            currentDisplay()
                    .resetTransform()
                    .style("#fff")
                    .font("TW Cen MT", "72px", {weight: "700"}).textAlign("left").textBaseline("top").charSpacing("0")
                    .continuousWriter(36, 24,
                        ["SCREEN #", canvas => canvas.style("hsl(240, 30%, 30%)")],
                        [drawTimer.data.keyword, canvas => canvas.style("#fff")],
                    );
                    //.write(drawTimer.data.keyword, 24, 24);

            const responses = drawTimer.data.responses();

            const verticalOffset = i => 120 + 96 * i;

            // Writes letter identifiers
            currentDisplay()
                    .style("hsl(240, 30%, 50%)")
                    .font("TW Cen MT", "64px", {weight: "800"})
                    .textAlign("center");
            
            for (let i = 0; i < responses.length; i++) {
                currentDisplay()
                        .resetTransform()
                        .write(String.fromCharCode("A".charCodeAt() + i), 64, verticalOffset(i));
            }

            // Writes responses
            currentDisplay()
                    .style("#fff")
                    .textAlign("left")
                    .font("TW Cen MT Condensed", "48px", {weight: "700"});

            for (let i = 0; i < responses.length; i++) {
                const textWidth = currentDisplay().measureText(responses[i].text).width;
                currentDisplay()
                        // Adjusts scaling to fit response into display area
                        .resetTransform()
                        .translate(128, 0)
                        .scale(min(1080 / textWidth, 1), 1)
                        
                        // Writes response
                        .write(responses[i], 0, verticalOffset(i) + 8);
            }

            break;

        case dashboard.StatesDependent.REVEAL:
            break;

        case dashboard.StatesDependent.LEADERBOARD:
            break;
    }

    requestAnimationFrame(draw);
}

function init() {
    onizeControls();

    game.setState(dashboard.StatesDependent.STANDBY);
    dashboard.viewPage("prompt loadout", true);

    setDisplayDimensions(1280, 720);
    requestAnimationFrame(draw);

    // easter egg
    if (location.search.substr(1) === "GREEN") {
        document.documentElement.classList.add("green");
    }

    //onbeforeunload = () => game.state !== dashboard.StatesDependent.STANDBY;
}