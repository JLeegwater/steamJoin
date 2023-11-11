require("dotenv").config();

const axios = require("axios");
const cron = require("node-cron");

const tinyUrlChangeEndpoint =
	"https://api.tinyurl.com/change?api_token=" + process.env.TINYURL_API_TOKEN;
const errorPageURL = process.env.ERROR_PAGE;
const steamApiKey = process.env.STEAM_API_KEY;
const steamID64 = process.env.STEAM_ID64;

let lastJoinGameLink;
let lastLobbySteamID;

const fetchAndShortenJoinGameLink = () => {
	axios
		.get(
			`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamApiKey}&format=json&steamids=${steamID64}`
		)
		.then((response) => {
			// Assuming response.data contains the necessary information
			const gameid = response.data.response.players[0].gameid;
			const lobbysteamid = response.data.response.players[0].lobbysteamid;

			if (!lobbysteamid && lobbysteamid !== lastLobbySteamID) {
				lastLobbySteamID = lobbysteamid;
				console.error("No lobby steam id found");
				updateTinyUrl(errorPageURL);
				return;
			}

			const joinGameLink = `steam://joinlobby/${gameid}/${lobbysteamid}/${steamID64}`;

			if (joinGameLink !== lastJoinGameLink) {
				lastJoinGameLink = joinGameLink;
				updateTinyUrl(joinGameLink);
			} else {
				console.log("Join game link has not changed");
			}
		})
		.catch((error) => {
			console.error("Error fetching Steam data: " + error);
			updateTinyUrl(errorPageURL);
		});
};

const updateTinyUrl = (url) => {
	axios
		.patch(tinyUrlChangeEndpoint, {
			url: url,
			domain: "tinyurl.com",
			alias: process.env.TINYURL_ALIAS,
		})
		.then((response) => {
			console.log("TinyURL link updated: " + response.data);
		})
		.catch((error) => {
			console.error("Error updating TinyURL link: " + error);
		});
};

// Run the function once immediately when the script starts
fetchAndShortenJoinGameLink();

// Then schedule it to run every minute
cron.schedule("* * * * *", fetchAndShortenJoinGameLink);
