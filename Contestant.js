import {qs, qsa, declade} from "./util.js";
import {game, dashboard} from "./game.js";

const {sqrt} = Math;

const map = new WeakMap();
const _ = key => map.get(key);

export class Contestant {
    constructor(name) {
        map.set(this, {});

        this.bar = dashboard.build.contestantListing(this);
        this.barResponder = dashboard.build.contestantResponder();

        this.name = name;
        this.alive = true;
        this.responses = [];
        // `this.responsesPermitted` is not set on initialization. This prevents a [-1] index appearing on the responses array
    }

    eliminate(updateContestantList=true) {
        this.alive = false;
        this.bar.classList.add("eliminated");
        qs("button", this.bar).disabled = true;

        if (updateContestantList) {
            dashboard.updateContestantList();
        }

        return this;
    }

    // different from elimination in that this account is removed from the game entirely—used primarily during lobby
    remove() {
        this.alive = false;
        game.contestants.splice(this.index, 1);
        dashboard.updateContestantList();
        return this;
    }

    setResponse(text, i=0, roundNumber=game.roundNumber) {
        const response = new Respo(text, this, roundNumber);
        this.responses[roundNumber][i] = response;
        return response;
    }

    toString() {
        return this.name;
    }

    set name(name) {
        _(this).name = name.toString().trim();

        qs("input.name", this.bar).value = _(this).name;
        qs(".name", this.barResponder).textContent = _(this).name;
    }
    get name() {
        return _(this).name;
    }

    set responsesPermitted(responsesPermitted) {
        _(this).responsesPermitted = parseInt(responsesPermitted) || 1;

        this.resetResponder();
        this.responses[game.roundNumber] = new Array(_(this).responsesPermitted).fill("");
    }
    get responsesPermitted() {
        return _(this).responsesPermitted;
    }

    resetResponder() {
        declade(qs(".responses", this.barResponder));

        for (let i = 0; i < _(this).responsesPermitted; i++) {
            const bar = dashboard.build.contestantIndividualResponder(i);

            qs(".responses", this.barResponder).appendChild(bar);
        }

        return this;
    }
    
    get index() {
        return game.contestants.indexOf(this);
    }
}

const bordaFromPosition = index => 1 - index / (game.responsesInSingleScreen - 1);
export class Respo {
    constructor(text, contestant, roundNumber) {
        this.text = text;
        this.contestant = contestant;
        this.roundNumber = roundNumber;

        this.votes = 0;
        this.votePositions = new Map();
    }

    getVotePosition(n) {
        return this.votePositions.get(n) || 0;
    }

    appear(n, weight=1) {
        this.votes += weight;
        this.votePositions.set(n, this.getVotePosition(n) + weight);
    }

    toString() {
        return this.text;
    }

    get index() {
        // optimize
        this.contestant.responses[this.roundNumber].sort((a, b) => b.averageBorda - a.averageBorda);
        return this.contestant.responses[this.roundNumber].indexOf(this);
    }

    get averagePosition() {
        let cumScore = 0;
        for (let [position, amount] of this.votePositions) {
            // Multiplying by `amount` is equivalent to weighting the average
            cumScore += amount * position;
        }

        return cumScore / this.votes;
    }

    get averageBorda() {
        return bordaFromPosition(this.averagePosition);
    }

    get bordaVariance() {
        const averageBorda = this.averageBorda;

        let cumScore = 0;
        for (let [position, amount] of this.votePositions) {
            cumScore += amount * (bordaFromPosition(position) - averageBorda) ** 2;
        }

        return cumScore / this.votes;
    }
    
    get bordaStandardDeviation() {
        return sqrt(this.bordaVariance);
    }

    get percentageStandardDeviation() {
        return 2 * this.bordaStandardDeviation;
    }

    get skew() {
        const averageBorda = this.averageBorda;
        const standardDeviation = this.bordaStandardDeviation;
        
        let cumScore = 0;
        for (let [position, amount] of this.votePositions) {
            cumScore += amount * ((bordaFromPosition(position) - averageBorda) / standardDeviation) ** 3;
        }

        // Since skew is directional, takes the opposite to reflect the direction represented by the borda
        return -cumScore / this.votes || 0;
    }
}