import {qs, qsa, ce, mod, declade, btoaN} from "./util.js";

const {min, max, round, random, floor} = Math;

let contestantEliminationRatio = NaN;
export const game = {
    reset() {
        this.setState(dashboard.StatesDependent.STANDBY);
        this.rounds = [];
        this.contestants = [];
        dashboard.updateContestantList();
        dashboard.clearPromptList();
    },

    state: null,
    setState(state) {
        console.log("Moving to state:", state);
        this.state = state;

        dashboard.viewPage(state);
    },

    rounds: [],
    get roundNumber() {
        return this.rounds.length - 1;
    },

    advanceRound() {
        if (this.roundNumber >= 0) {
            // Store all the statistics for this round
            const currentRound = this.rounds[this.roundNumber];
            currentRound.responses = this.activeResponses;
            currentRound.votes = this.votes;
            currentRound.voters = this.voters;
        }

        this.rounds.push(new Round(dashboard.getPrompt(this.roundNumber + 1)));
        console.log("Moving to round:", this.roundNumber);
        console.log(this.rounds[this.roundNumber]);

        // Reset the statistics
        this.votes = 0;
        this.voters = 0;

        if (this.contestantsRemaining.length <= 1) {
            this.reset();
        } else {
            for (let contestant of this.contestantsRemaining) {
                // Reset responders
                contestant.responsesPermitted = 1;
            }
            this.setState(dashboard.StatesDependent.RESPONDING);
        }

        this.contestantsHaveBeenEliminatedThisRound = false;
        dashboard.updateContestantList();

        return this;
    },

    updateCurrentPrompt(prompt) {
        this.rounds[this.roundNumber].prompt = prompt;
    },

    contestants: [],
    addContestant(contestant) {
        console.log("Adding a contestant:", contestant.name, contestant);
        this.contestants.push(contestant);
        return contestant;
    },
    get contestantsRemaining() {
        return this.contestants.filter(contestant => contestant.alive);
    },

    contestantEliminationRatioDefault: .25,
    set contestantEliminationRatio(ratio) {
        if (typeof ratio === "string") {
            ratio = parseFloat(ratio);
        }

        const defaultedRatio = isNaN(ratio) ? game.contestantEliminationRatioDefault : ratio;
        contestantEliminationRatio = min(1, max(0, defaultedRatio));

        // Update input
        const promptLoadoutControls = dashboard.getPageByState(dashboard.StatesIndependent.PROMPT_LOADOUT, true);

        const input = qs("input[name='elimination-rate']", promptLoadoutControls);
        input.value = formatFloat(contestantEliminationRatio);

        dashboard.updateEliminationCounter();

        function formatFloat(n) {
            if (n !== floor(n)) return n.toString();
            return n + ".0";
        }
    },
    get contestantEliminationRatio() {
        return isNaN(contestantEliminationRatio) ? this.contestantEliminationRatioDefault : contestantEliminationRatio;
    },

    getNumberOfPlannedRounds() {
        let currentRound = max(this.roundNumber, 0) + Number(this.contestantsHaveBeenEliminatedThisRound);
        let contestantPoolSize = this.contestantsRemaining.length;

        while (contestantPoolSize > 1) {
            currentRound++;
            contestantPoolSize -= this.getContestantEliminationCount(contestantPoolSize);
        }

        return currentRound;
    },

    getContestantEliminationCount(contestantPoolSize=this.contestantsRemaining.length) {
        return contestantPoolSize > 1
                ? max(1, min(contestantPoolSize - 1, round(contestantPoolSize * this.contestantEliminationRatio)))
                : 0;
    },
    getContestantSurvivorCount() {
        return this.contestantsRemaining.length - this.getContestantEliminationCount();
    },
    eliminateContestants() {
        const topResponses = this.activeResponsesTopSorted;
        const eliminationCount = this.getContestantEliminationCount();

        for (let i = 0; i < topResponses.length; i++) {
            const response = topResponses[i];

            if (i >= topResponses.length - eliminationCount) {
                response.contestant.eliminate(false);
            }
        }
        
        this.contestantsHaveBeenEliminatedThisRound = true;
        dashboard.updateContestantList();
    },

    eliminateNonResponders() {
        contestantsLoop:
        for (let contestant of this.contestantsRemaining) {
            for (let response of contestant.responses[this.roundNumber]) {
                if (response) continue contestantsLoop;
            }
            contestant.eliminate(false);
        }

        dashboard.updateContestantList();
    },

    contestantsHaveBeenEliminatedThisRound: false,

    get activeResponses() {
        // Gets the current responses of each contestant and flattens the resulting array
        // optimize
        return this.contestants.flatMap(contestant => (contestant.responses[this.roundNumber] || []).filter(response => response.text));
    },
    get activeResponsesSorted() {
        return this.activeResponses.sort((a, b) => b.averageBorda - a.averageBorda);
    },
    get activeResponsesTopSorted() {
        return this.activeResponsesSorted.filter(response => response.index === 0);
    },

    maxResponsesInSingleScreen: 6,
    get responsesInSingleScreen() {
        return min(this.maxResponsesInSingleScreen, this.activeResponses.length);
    },
    get finalScreenLetter() {
        return String.fromCharCode("A".charCodeAt() + this.responsesInSingleScreen);
    },

    selectActiveResponses(keyword) {
        const activeResponses = this.activeResponses;
        const indices = randintUnrepeating(this.maxResponsesInSingleScreen, activeResponses.length, randomGeneratorFromKeyword(keyword));

        return indices.map(index => activeResponses[index]);
    },

    groomVote(text) {
        return text.toUpperCase().replace(/[^\w ]/gi, "");
    },
    voteIsParseable(text) {
        const responseSequence = this.groomVote(text).split(" ")[1];
        // If there is no response sequence or there are invalid response identifiers, returns
        return responseSequence && !(new RegExp(`[^A-${this.finalScreenLetter}]`).test(responseSequence));
    },

    votes: 0,
    voters: 0,
    countVote(text, weightDivisor) {
        text = this.groomVote(text);
        const [keyword, responseSequence] = text.split(" ");

        const responses = this.selectActiveResponses(keyword);

        // Iterates through each letter of the responses
        let position = 0;
        for (let letter of responseSequence) {
            // Selects a response by the letter identifier
            const index = letter.charCodeAt() - "A".charCodeAt();
            const response = responses[index];

            // Count as a vote at this position
            response.appear(position, 1 / weightDivisor);
            position++;
        }
        this.votes++;
    },

    wordCountingRegex: /\b\S+/g,
};

export const dashboard = {
    viewPage(state, independent=false) {
        for (let name of Object.values(independent ? this.StatesIndependent : this.StatesDependent)) {
            const page = this.getPageByState(name, independent);
            const tab = this.getTabByState(name, independent);

            if (state === name) {
                page.classList.add("active");
                tab.classList.add("active");
            } else {
                page.classList.remove("active");
                tab.classList.remove("active");
            }
            if (independent) continue;

            if (game.state === name) {
                page.classList.remove("disabled");
                tab.classList.remove("disabled");
            } else {
                page.classList.add("disabled");
                tab.classList.add("disabled");
            }
        }
    },
    getPageByState(state, independent=false) {
        return qs(`.dashboard > .state-${independent ? "in" : ""}dependent > .inputs > [data-state="${state}"]`);
    },
    getTabByState(state, independent=false) {
        return qs(`.dashboard > .state-${independent ? "in" : ""}dependent > .tabs > li[data-state="${state}"]`);
    },

    StatesDependent: Object.freeze({
        STANDBY: "standby",
        LOBBY: "lobby",
        RESPONDING: "responding",
        VOTING: "voting",
        REVEAL: "reveal",
        LEADERBOARD: "leaderboard",
    }),
    StatesIndependent: Object.freeze({
        PROMPT_LOADOUT: "prompt loadout",
        CONTESTANT_LIST: "contestant list",
        PREVIOUS_RESULTS: "previous results",
        VIEWPORT: "viewport",
        ABOUT: "about",
    }),

    // selects all children of the element with the “inputs” class—to add a new entry, create a new child in the HTML document
    pagesDependent: [...qsa(".dashboard > .state-dependent > .inputs > *")],
    pagesIndependent: [...qsa(".dashboard > .state-independent > .inputs > *")],

    updateContestantList() {
        // contestant list page
        const contestantList = declade(qs(".dashboard > .state-independent > .inputs .contestant-list"));
        
        for (let contestant of game.contestants) {
            contestantList.appendChild(contestant.bar);
            contestant.bar.setAttribute("data-index", contestant.index);
        }

        // responding page
        const controlsResponding = this.getPageByState(this.StatesDependent.RESPONDING);
        const responsesPanel = declade(qs(".responses-panel", controlsResponding));

        for (let contestant of game.contestantsRemaining) {
            responsesPanel.appendChild(contestant.barResponder);
            contestant.barResponder.setAttribute("data-index", contestant.index);
        }

        this.updateEliminationCounter();
    },

    updateEliminationCounter() {
        const promptLoadoutControls = this.getPageByState(this.StatesIndependent.PROMPT_LOADOUT, true);

        const contestantEliminationCount = game.getContestantEliminationCount();
    
        console.log(contestantEliminationCount, (1 !== 1
            ? "were"
            : "was"));
        const predicate = !game.contestantsHaveBeenEliminatedThisRound
                ? "will be"
                : (contestantEliminationCount !== 1
                        ? "were"
                        : "was");

        updateCounter(game.getNumberOfPlannedRounds(), "n-planned-rounds", "n-planned-rounds-plural");

        if (!game.contestantsHaveBeenEliminatedThisRound) {
            updateCounter(contestantEliminationCount, "n-eliminations", "n-eliminations-plural");
            updateCounter(game.getContestantSurvivorCount(), "n-survivors");
            
            qs("span[data-name='n-eliminations-predicate']", promptLoadoutControls).textContent = predicate;
        }
        
        function updateCounter(value, counterEmName, pluralizerName) {
            qs(`em[data-name='${counterEmName}']`, promptLoadoutControls).textContent = value;

            if (pluralizerName) {
                qs(`span[data-name='${pluralizerName}']`, promptLoadoutControls).textContent = value !== 1 ? "s" : "";
            }
        }
    },

    updatePromptList() {
        const promptBars = this.promptList.children;

        let i = 0;
        for (let promptBar of promptBars) {
            qs(".round-number", promptBar).textContent = i + 1;

            i++;
        }
    },

    setAdvanceButtons() {
        const controlsLobby = this.getPageByState(this.StatesDependent.LOBBY);
        qs("button[name='advance']", controlsLobby).disabled = game.contestants.length < 2 || !this.getPrompt(game.roundNumber + 1);
        
        const controlsLeaderboard = this.getPageByState(this.StatesDependent.LEADERBOARD);
        qs("button[name='advance']", controlsLeaderboard).disabled = game.contestantsRemaining.length > 1 ? !this.getPrompt(game.roundNumber + 1) : false;
    },

    clearPromptList() {
        declade(this.promptList);
    },

    getPromptBar(i=game.roundNumber) {
        return this.promptList.children[i];
    },

    getPrompt(i=game.roundNumber) {
        const promptBar = this.getPromptBar(i);

        if (!promptBar) return false;
        return qs("input", promptBar).value;
    },

    smallSwitchSide(independent=true) {
        if (independent) {
            qs(".dashboard > .state-dependent").classList.remove("active");
            qs(".dashboard > .state-independent").classList.add("active");
        } else {
            qs(".dashboard > .state-dependent").classList.add("active");
            qs(".dashboard > .state-independent").classList.remove("active");
        }
    },

    build: {
        generic: {
            xButton() {
                const button = document.createElement("button");
                button.textContent = "✕";
                return button;
            }
        },

        // a bar in the contestant list page
        contestantListing(contestant) {
            const bar = document.createElement("tr");
        
            const buttonTd = document.createElement("td");
            const button = this.generic.xButton();
            button.addEventListener("click", () => {
                if (game.state !== dashboard.StatesDependent.LOBBY) {
                    contestant.eliminate();
                } else {
                    contestant.remove();
                }
            });
            buttonTd.appendChild(button);
        
            const nameTd = document.createElement("td");
            const name = document.createElement("input");
            name.type = "text";
            name.placeholder = "Contestant name";
            name.classList.add("name");
            nameTd.appendChild(name);
        
            bar.appendChild(buttonTd);
            bar.appendChild(nameTd);
        
            return bar;
        },
    
        // a bar in the responding page
        contestantResponder() {
            // data-index attribute is set in `dashboard.updateContestantList`
            const bar = document.createElement("tr");
        
            const nameTd = document.createElement("td");
            nameTd.classList.add("name");
        
            const responsesTd = document.createElement("td");
            responsesTd.classList.add("responses");
        
            bar.appendChild(nameTd);
            bar.appendChild(responsesTd);
        
            return bar;
        },
    
        // one input row in a bar in the responding page
        contestantIndividualResponder(i) {
            const bar = document.createElement("div");
            bar.classList.add("response");
        
            const input = document.createElement("input");
            input.type = "text";
            input.placeholder = "[DNP]";
            input.setAttribute("data-index", i);
        
            const wordCount = document.createElement("div");
            wordCount.textContent = "0";
            wordCount.classList.add("word-count");
        
            input.addEventListener("input", () => {
                wordCount.textContent = (input.value.match(game.wordCountingRegex) || []).length;
            });
        
            input.addEventListener("change", event => {
                const bar = event.path.find(element => element.tagName && element.tagName.toUpperCase() === "TR");
                if (!bar) return;
        
                const processedResponse = input.value.trim();
        
                const contestant = game.contestants[bar.getAttribute("data-index")];
                contestant.setResponse(processedResponse, input.getAttribute("data-index"));
                input.value = processedResponse;
        
                console.log("Saved for", contestant.name, "the response", `"${processedResponse}"`);
            });
        
            bar.appendChild(input);
            bar.appendChild(wordCount);
        
            return bar;
        },
        
        // one bar on the prompt loadout page
        promptListing() {
            const bar = ce("tr");
            
            const roundNumberTd = ce("td");
            const roundNumber = ce("span");
            roundNumber.classList.add("round-number");
            roundNumberTd.appendChild(roundNumber);

            const buttonTd = ce("td");
            const button = this.generic.xButton();
            button.addEventListener("click", () => {
                bar.remove();
                dashboard.updatePromptList();
            });
            buttonTd.appendChild(button);
        
            const promptTd = ce("td");
            const prompt = ce("input");
            prompt.type = "text";
            prompt.placeholder = "Prompt";
            promptTd.appendChild(prompt);

            bar.appendChild(roundNumberTd);
            bar.appendChild(buttonTd);
            bar.appendChild(promptTd);
        
            return bar;
        },
    },
};
dashboard.promptList = qs(".prompt-list", dashboard.getPageByState(dashboard.StatesIndependent.PROMPT_LOADOUT, true));

class Round {
    constructor(prompt, {
        votes,
        voters,
        responses=[],
    }={}) {
        this.prompt = prompt;

        this.votes = votes;
        this.voters = voters;
        this.responses = responses;
    }

    get index() {
        return game.rounds.indexOf(this);
    }
}

function randintUnrepeating(n, max, generateNumber=random) {
    // Prevents `n` from surpassing `max`
    n = min(n, max);

    const output = [];

    // Creates an available value pool with integers in interval [0, `max`]
    const pool = new Array(max).fill().map((value, i) => i);
    
    for (let i = 0; i < n; i++) {
        // Takes a random index, then find the corresponding value from the pool and move it to the output array
        const index = floor(generateNumber() * pool.length);
        output.push(pool.splice(index, 1)[0]);
    }

    return output;
}

function randintRepeating(n, max, generateNumber=random) {
    const output = [];

    for (let i = 0; i < n; i++) {
        output.push(floor(max * generateNumber()));
    }

    return output;
}

const randomGeneratorFromKeyword = (() => {
    // arbitrary max and prime factor
    const seederMax = Number.MAX_SAFE_INTEGER;
    const prime = 62081;

    // Randomizes on every page load; stays constant during each game
    const operationSequence = randintRepeating(6, 1);
    const operationAt = i => operationSequence[i % operationSequence.length];

    function randomGeneratorFromInt(seed=0) {
        // Moves the integer seed into the interval [0, `seederMax`)
        seed = mod(floor(seed), seederMax);

        return () => {
            seed = seed * prime % seederMax;
            return seed / seederMax;
        };
    }

    function randomGeneratorFromKeyword(keyword="") {
        let seed = 1;

        let i = 0;
        for (let char of btoaN(keyword.toLowerCase(), 2)) {
            // Modulos as extra precaution not to surpass the max safe value
            const charCode = char.charCodeAt();

            seed = (operationAt(i) === 0 ? seed * charCode : seed + charCode ** 2) % seederMax;

            i++;
        }

        return randomGeneratorFromInt(seed);
    }

    return randomGeneratorFromKeyword;
})();