BG = {
  uscale: 6,
  pbarmax: 600
};
BG.draw_pscale = function () {
  var canvas = $("#pbar")[0];
  BG.pbar = canvas.getContext("2d");
  BG.pbar.clearRect(0, 0, canvas.width, canvas.height);
  BG.pbar.font = "10px sans-serif";
  BG.pbar.textBaseline = "top";
  BG.pbar.textAlign = "center";
  var pv = [0.01, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99];
  for (var pi in pv) {
    var p = pv[pi];
    var pu = -Math.log(1 / p - 1);
    var px = (pu / BG.uscale + 1) / 2 * (BG.pbarmax);
    BG.pbar.fillRect(px, 0, 1, 10);
    BG.pbar.fillText(p.toFixed(2), px, 10 + 10 * (pi % 3));
  };
}

BG.do_refresh = function () {
  BG.draw_pscale();
  var s = $("#slider1")[0];
  var u = (2 * s.value / (BG.pbarmax) - 1) * BG.uscale;
  var a = 1 / (1 + Math.exp(-u));
  // Allow the player to "die" if they want to
  if (s.value == BG.pbarmax) {
    u = Infinity;
    a = 1;
  }
  if (s.value == 0) {
    u = -Infinity;
    a = 0;
  }
  BG.a = a;
  var par1 = 1 / Math.log(2);
  var par0 = 1.0;
  var payoff0 = par0 + par1 * Math.log(1 - a);
  var payoff1 = par0 + par1 * Math.log(a);
  BG.payoff = [payoff0, payoff1];
  $("#payoff0").html(payoff0.toFixed(3));
  $("#payoff1").html(payoff1.toFixed(3));
  $("#a").html(a.toFixed(3));
  $("[name='heads']").html(BG.labels[1]);
  $("[name='tails']").html(BG.labels[0]);
  $("#score").html(BG.score.toFixed(3));
  $("#plays").html(BG.plays);
  $("#score_per_play").html((BG.score / BG.plays).toFixed(3));
  $("#game_title").html(BG.title);
  BG.pbar.fillStyle = "#B0E";
  BG.pbar.fillRect(s.value, 0, 1, 10);
  BG.pbar.fillStyle = "#000";
}

BG.show_final_score = function () {
  BG.logEvent('<span class="hot">Final score:</span> <span class="cool">' + BG.score.toFixed(3) +
    '</span> after <span class="cool">' + BG.plays + '</span> plays, for an average score per play of <span class="cool">' +
    (BG.score / BG.plays).toFixed(3) + '</span>.');
}
BG.start_game = function (gameix) {
  if (BG.plays > 0 && !BG.stop) {
    BG.show_final_score();
  }
  var game = BG.games[gameix];
  $("#game_selector")[0].value = gameix;
  BG.score = 0;
  BG.plays = 0;
  BG.game = game;
  BG.stop = false;
  BG.title = game.title;
  BG.logEvent("");
  BG.logEvent("<span class='hot'>Starting game: " + BG.title + "</span>");
  BG.labels = game.labels;

  var init = BG.game.initialize();
  BG.logEvent(init.html);
  BG.draw = BG.game.draw();
  BG.logEvent(BG.draw.html);
  if (BG.draw.stop) {
    BG.stop = true;
  }
  BG.do_refresh();
};

BG.on_bet = function (event) {
  if (BG.stop) {
    alert("This game is finished. Choose a new game from the selector at the top.")
  } else {
    var payoff = BG.payoff[BG.draw.outcome];
    var msg1 = "You bet as if p=" + BG.a.toFixed(3) + " and the outcome was <span class='cool'>" + BG.labels[BG.draw.outcome] + "</span>.";
    var msg2;
    if (payoff >= 0) msg2 = "You gained " + payoff.toFixed(3) + " points."
    else msg2 = "You lost " + (-payoff).toFixed(3) + " points."
    BG.score += payoff;
    BG.plays += 1;
    BG.logEvent("<span style='color:#55F'>" + msg1 + " " + msg2 + "</span>")
    BG.draw = BG.game.draw();
    if (BG.draw.stop) {
      BG.stop = true;
    }
    var current_score = {
      score: BG.score,
      plays: BG.plays,
      avgscore: BG.score / BG.plays
    };
    if (BG.plays === 1) { // create a game_scores object for this session
      if (BG.game_scores[BG.title] === undefined) BG.game_scores[BG.title] = [];
      BG.game_scores[BG.title] = BG.game_scores[BG.title].concat([current_score]);
    } else {
      BG.game_scores[BG.title] = BG.game_scores[BG.title].slice(0, -1).concat([current_score]);
    }
    sessionStorage.setItem('game_scores', JSON.stringify(BG.game_scores));
    BG.logEvent(BG.draw.html);
    if (BG.stop) {
      BG.show_final_score();
      BG.logEvent("Choose a new game from the selector at the top.")
    }
  }
  BG.do_refresh();
}

BG.logEvent = function (h) {
  var l = $("#log")
  l.append(h + "<br>");
  l.scrollTop(l[0].scrollHeight);
}

BG.setup = function () {
  var gs = sessionStorage.getItem('game_scores');
  //sessionStorage.setItem('game_scores','{}') // use this if it gets corrupted
  //JSON.stringify(BG.game_scores,undefined,2) // use this to see the status
  if (gs === null) {
    gs = {};
    sessionStorage.setItem('game_scores', JSON.stringify(gs))
  } else gs = JSON.parse(gs);
  BG.game_scores = gs;
  $("#slider1").change(function (e) {
    BG.do_refresh();
  })
  $("#controls_form").submit(function (event) {
    BG.on_bet(event);
    event.preventDefault();
  });
  var selectopts = "";
  for (var gameix in BG.games) {
    var game = BG.games[gameix];
    var gt = game.title;
    selectopts += "<option value='" + gameix + "'>" + gt + "</option>"
  }
  $("#game_selector").html(selectopts);
  $("#game_selector").change(function (e) {
    //console.log(e);console.log(this);
    var gameix = $("#game_selector")[0].value;
    BG.start_game(gameix);
  });
  // buggy. Weirdness on Firefox.
  //$("#pbar").mousemove(BG.pbar_mouse);
  //$("#pbar").mousedown(BG.pbar_mouse);
}

BG.pbar_mouse = function (e) {
  if (e.which) {
    $("#slider1")[0].value = e.offsetX;
    BG.do_refresh();
  }
}