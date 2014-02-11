Guess Calibration
=================

This game challenges you to assign a probability to the next yes/no event (from either a deterministic process like the quiz or from a panel of random processes). You choose p in [0,1], it sets the payoffs for the events yes/no accordingly as: 1+log2(p) or 1+log2(1-p). It tracks your winnings over multiple plays. If you aren't setting p according to your fully conditioned posterior probability of the next event, you're not maximizing the expected return. Learning to play the game well, then, in a way, is training yourself to assign probabilities appropriately.

Currently hosted here: [http://laplace.stanford.edu/guess-calibration/GuessCalibration.html](http://laplace.stanford.edu/guess-calibration/GuessCalibration.html)
Pull requests welcome.
