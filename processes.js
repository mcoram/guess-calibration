BG.describeCoin = function (p) {
  var coindesc;
  if (p === 0.5) coindesc = "fair coin";
  else coindesc = "p=" + p.toFixed(2) + " coin";
  return (coindesc);
}

BG.CoinProcess = function (pheads) {
  this.pheads = pheads;
  this.title = "Predict a " + BG.describeCoin(this.pheads);
  this.labels = ["Tails", "Heads"];
}
BG.CoinProcess.prototype.initialize = function () {
  return ({
    html: ""
  })
};
BG.CoinProcess.prototype.draw = function () {
  var coindesc = BG.describeCoin(this.pheads);
  var result = {
    html: "I'm about to flip a " + coindesc + ". Will I get heads?"
  };
  result.outcome = (Math.random() <= this.pheads) + 0;
  return (result);
};

BG.duplicateObject = function (obj) { // for object literals; shallow copy
  return ($.extend(true, {}, obj));
}
BG.extendObject = function (defaults, override) {
  return ($.extend(BG.duplicateObject(defaults), override));
}
BG.MaskedProcess = function (title, game, options) {
  this.game = game;
  this.title = title;
  var defaults = {
    labels: ["No", "Yes"],
    initialmessage: "I'm a mysterious process.",
    message: "Will I say yes this time?"
  };
  options = BG.extendObject(defaults, options);
  this.options = options;
  this.labels = options.labels;
}
BG.MaskedProcess.prototype.initialize = function () {
  var i1 = this.game.initialize();
  return ({
    html: this.options.initialmessage
  });
}
BG.MaskedProcess.prototype.draw = function () {
  var d1 = this.game.draw();
  var result = {
    html: this.options.message,
    outcome: d1.outcome
  };
  return (result);
}

BG.SimpleMarkovProcess = function (transprob, depth, initial) {
  this.transprob = transprob;
  this.depth = depth;
  this.initial = initial;
  this.title = 'Predict a Markov process with transitions: ' + JSON.stringify(transprob) + " and inital: " + JSON.stringify(initial);
  this.labels = ["Down", "Up"];
}
BG.SimpleMarkovProcess.prototype.initialize = function () {
  this.state = this.initial;
  return ({
    html: ""
  });
}
BG.SimpleMarkovProcess.prototype.draw = function () {
  var state = this.state;
  var tp = this.transprob;
  for (var i = 0; i < this.depth; i++) {
    tp = tp[state[i]];
  }
  // At this point tp should be a number in [0,1]
  var outcome = (Math.random() <= tp) + 0;
  this.state = state.slice(1).concat([outcome]);
  var result = {
    html: "Will it be up this time?",
    outcome: outcome
  };
  return (result);
}

BG.RandomCoinProcess = function (options) {
  var defaults = {
    labels: ["Tails", "Heads"],
    title: "Predict either a p=.3 coin or a p=.8 coin",
    probv: [.3, .8]
  };
  options = BG.extendObject(defaults, options);
  this.options = options;
  this.labels = options.labels;
  this.title = options.title;
  this.probv = options.probv;
}
BG.RandomCoinProcess.prototype = new BG.CoinProcess(0.5);
BG.RandomCoinProcess.prototype.initialize = function () {
  var ix = Math.floor(Math.random() * this.probv.length);
  this.pheads = this.probv[ix]; // override the prototype's pheads.
  return ({
    html: "Ok. I've picked the coin."
  })
};

BG.RandomCoinFromEnvelopeProcess = function (options) {
  var defaults = {
    labels: ["Tails", "Heads"],
    title: "Predict a coin whose freq. is drawn from a Beta(1,2) distribution",
    envelope: function (x) {
      return (Math.pow(1 - x, 1))
    }
  };
  options = BG.extendObject(defaults, options);
  this.options = options;
  this.labels = options.labels;
  this.title = options.title;
  this.envelope = options.envelope;
}
BG.RandomCoinFromEnvelopeProcess.prototype = new BG.CoinProcess(0.5);
// aka rejection sample
BG.envelope_sample = function (envelope) { // here envelope is assumed to map from [0,1] into [0,1]
  var x, y;
  do {
    x = Math.random();
    y = Math.random();
  } while (y > envelope(x));
  return (x);
}
BG.RandomCoinFromEnvelopeProcess.prototype.initialize = function () {
  this.pheads = BG.envelope_sample(this.envelope);
  return ({
    html: "Ok. I've picked the coin."
  })
}

BG.MaskedRepeatedProcess = function (title, game, options) {
  this.game = game;
  this.title = title;
  var defaults = {
    labels: ["Tails", "Heads"],
    initialmessage: "I have an \"urn\" of coins, with possibly different probabilities.",
    restartmessage: "I'm picking a fresh coin from the urn.",
    message: "I'm about to flip the coin. Will I get heads?",
    trials_per_session: 10
  };
  options = BG.extendObject(defaults, options);
  this.options = options;
  this.labels = options.labels;
  this.session = 1;
}
BG.MaskedRepeatedProcess.prototype.initialize = function () {
  var i1 = this.game.initialize();
  this.trial = 1;
  return ({
    html: this.options.initialmessage + " " + this.options.restartmessage
  });
}
BG.MaskedRepeatedProcess.prototype.draw = function () {
  var message = "";
  if (this.trial > this.options.trials_per_session) {
    message += this.options.restartmessage + " ";
    var init = this.game.initialize();
    this.session += 1;
    this.trial = 1;
  }
  message += this.options.message + " " + this.describeTrial();
  var d1 = this.game.draw();
  var result = {
    html: message,
    outcome: d1.outcome
  };
  this.trial = this.trial + 1;
  return (result);
}
BG.MaskedRepeatedProcess.prototype.describeTrial = function () {
  return ("[Trial " + this.trial + " of " + this.options.trials_per_session + "; Session " + this.session + "]");
}

BG.QuizProcess = function (options) {
  var defaults = {
    labels: ["False", "True"],
    initial_message: "",
    title: "Title is Mandatory",
    questions: [{
      q: "1+1=2. True?",
      a: 1
    }] // follow this format to supply questions / answers
  };
  options = BG.extendObject(defaults, options);
  this.options = options;
  this.labels = options.labels;
  this.title = options.title;
  this.questions = options.questions;
  this.trial = 0;
}
BG.QuizProcess.prototype.initialize = function () {
  this.trial = 0;
  return ({
    html: this.options.initial_message
  })
};
BG.QuizProcess.prototype.draw = function () {
  if (this.trial < this.questions.length) {
    var qa = this.questions[this.trial];
    var result = {
      html: qa.q,
      outcome: qa.a
    };
    this.trial += 1;
    return (result);
  } else return {
    html: "... And we're out of questions. Thanks for playing.",
    stop: true
  }
};
