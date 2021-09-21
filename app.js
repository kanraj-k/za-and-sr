const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000/players/");
    });
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
initializeDbAndServer();

// API 1 ==> get all the players
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT
    *
    FROM
    player_details
    ORDER BY
    player_id;
    `;
  const getAllPlayers = await db.all(getAllPlayersQuery);
  const getAllPlayersResponse = getAllPlayers.map((item) => {
    return {
      playerId: item.player_id,
      playerName: item.player_name,
    };
  });
  response.send(getAllPlayersResponse);
});

// API 2 ==> get the player with playerID
app.get("/players/:playerId", async (request, response) => {
  const playerId = request.params.playerId;
  const getPlayerQuery = `
    SELECT
    *
    FROM
    player_details
    WHERE player_id = ${playerId};
    `;
  const getPlayer = await db.get(getPlayerQuery);
  const getPlayerResponse = {
    playerId: getPlayer.player_id,
    playerName: getPlayer.player_name,
  };
  response.send(getPlayerResponse);
});

// API 3 ==> update the player with playerID
app.put("/players/:playerId/", async (request, response) => {
  const playerId = request.params.playerId;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE
    player_details
    SET
    player_name = "${playerName}"
    WHERE player_id = ${playerId};
    `;
  try {
    await db.get(updatePlayerQuery);
    response.send("Player Details Updated");
  } catch (err) {
    console.log("playerId does not exist", err);
  }
});

// API 4 ==> get match details with match id
app.get("/matches/:matchId/", async (request, response) => {
  const matchId = request.params.matchId;
  const getMatchDetailsQuery = `
    SELECT
    *
    FROM
    match_details
    WHERE match_id = ${matchId};
    `;
  const getMatchDetails = await db.get(getMatchDetailsQuery);
  const getMatchDetailsResponse = {
    matchId: getMatchDetails.match_id,
    match: getMatchDetails.match,
    year: getMatchDetails.year,
  };
  response.send(getMatchDetailsResponse);
});

// API 5 ==> get match details of a player with player id
app.get("/players/:playerId/matches/", async (request, response) => {
  const playerId = request.params.playerId;
  const getMatchDetailOfAPlayersQuery = `
    SELECT
    DISTINCT match_id,
    match,
    year
    FROM
    player_match_score NATURAL JOIN match_details
    WHERE player_id = ${playerId};
    `;
  const getMatchDetailsOfAPlayer = await db.all(getMatchDetailOfAPlayersQuery);
  const getMatchDetailsOfAPlayerResponse = getMatchDetailsOfAPlayer.map(
    (item) => {
      return {
        matchId: item.match_id,
        match: item.match,
        year: item.year,
      };
    }
  );
  response.send(getMatchDetailsOfAPlayerResponse);
});

// API 6 ==> get list of players in a specific match with match id
app.get("/matches/:matchId/players/", async (request, response) => {
  const matchId = request.params.matchId;
  const getPlayersListInAMatchQuery = `
    SELECT
    DISTINCT player_id,
    player_name
    FROM
    player_match_score NATURAL JOIN player_details
    WHERE match_id = ${matchId};
    `;
  const getPlayersListInAMatch = await db.all(getPlayersListInAMatchQuery);
  const getPlayersListInAMatchResponse = getPlayersListInAMatch.map((item) => {
    return {
      playerId: item.player_id,
      playerName: item.player_name,
    };
  });
  response.send(getPlayersListInAMatchResponse);
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const playerId = request.params.playerId;
  const getTotalScoresOfAPlayerQuery = `
    SELECT
player_match_id,  
    player_name,
    sum(score) as total_score,
    sum(fours) as total_fours,
    sum(sixes) as total_sixes
    FROM
    player_match_score NATURAL JOIN player_details
    WHERE player_id = ${playerId};
    `;
  const getTotalScoresOfAPlayer = await db.get(getTotalScoresOfAPlayerQuery);
  const getTotalScoresOfAPlayerResponse = {
    playerId: playerId,
    playerName: getTotalScoresOfAPlayer.player_name,
    totalScore: getTotalScoresOfAPlayer.total_score,
    totalFours: getTotalScoresOfAPlayer.total_fours,
    totalSixes: getTotalScoresOfAPlayer.total_sixes,
  };
  response.send(getTotalScoresOfAPlayerResponse);
});

module.exports = app;
