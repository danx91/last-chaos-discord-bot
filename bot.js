/*
	Import required things
*/
const mysql = require("mysql")
const crypto = require("crypto")
const { Client, Events, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
	TextBasedChannel, ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ModalSubmitInteraction } = require("discord.js")

const { TOKEN, MYSQL, MESSAGE, REGISTER } = require("./config.json")

/*
	Connect to the MySQL
*/
let mysqlConnected = false
let mysqlAttempts = 0
const db = mysql.createConnection({
	host: MYSQL.HOST,
	port: MYSQL.PORT,
	user: MYSQL.USER,
	password: MYSQL.PASSWORD
})

function MySQLConnect() {
	db.connect((err) => {
		if(err) {
			mysqlAttempts += 1
			
			console.error(err)
			console.error(`"Failed to connect to the database! Retry in 5 seconds... (${mysqlAttempts}/5)`)

			if(mysqlAttempts >= MYSQL.ATTEMPTS) {
				console.error(`Failed to connect to the database ${MYSQL.ATTEMPTS} times! Stopping app...`)
				process.exit(1)
			}

			setTimeout(MySQLConnect, 5000)
			return
		}

		mysqlConnected = true
		console.log(`MySQL connected on ${db.config.host}:${db.config.port} as ${db.config.user}`)

		db.query(`CREATE DATABASE IF NOT EXISTS ${MYSQL.BOT_DATABASE};`)
		db.query(`CREATE TABLE IF NOT EXISTS ${MYSQL.BOT_DATABASE}.users (
			discord_id VARCHAR(32) NOT NULL PRIMARY KEY,
			lc_id INT(10) UNSIGNED NOT NULL
		) ENGINE=MyISAM DEFAULT CHARSET=latin1;`)
	})
}

MySQLConnect()

/**
 * Convert query method to promise for sake of sanity
 * @param  {...any} args 
 * @returns {Promise}
 */
function MySQLQuery(...args) {
	return new Promise((resolve, reject) => {
		if(!mysqlConnected) {
			reject("MySQL is not connected!")
			return
		}

		db.query(...args, (err, results, fields) => {
			if(err) {
				reject(err)
				return
			}

			resolve({
				results: results,
				fields: fields
			})
		})
	})
}

/*
	Connect to the bot
*/
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
})

client.once(Events.ClientReady, bot => {
	console.log(`Connected as ${bot.user.tag}`)
})

console.log("Logging in to Discord bot...")
client.login(TOKEN)

/*
	Handle slash commands, buttons and modals
*/
client.on(Events.InteractionCreate, async interaction => {
	if(interaction.isChatInputCommand() && interaction.commandName === "last-chaos-spawn") {
		console.log(`Received 'last-chaos-spawn' request! User: ${interaction.user.tag}, Guild: ${interaction.guildId}, Channel: ${interaction.channelId}`)

		if(await CreateMessage(interaction.channel)){
			await interaction.reply({
				content: "OK",
				ephemeral: true
			})
		} else {
			await interaction.reply({
				content: "Error! Check bot console for more informations!",
				ephemeral: true
			})
		}
	} else if(interaction.isButton() || interaction.isModalSubmit()) {
		console.log(`Received '${interaction.customId}' request! User: ${interaction.user.tag}, Guild: ${interaction.guildId}, Channel: ${interaction.channelId}`)

		try {
			switch(interaction.customId) {
				case "register": await RegisterUserStep1(interaction); break
				case "rules-accept": await RegisterUserStep2(interaction); break
				case "account-data": await VerifyAccountData(interaction); break
				default: throw Error(`Unknown interaction ${interaction.customId}`)
			}
		} catch (error) {
			console.error(error)
			console.error("An error occured!")

			if(interaction.deferred){
				await interaction.editReply({
					content: REGISTER.ERROR_INTERNAL,
					ephemeral: true,
				})
			} else {
				await interaction.reply({
					content: REGISTER.ERROR_INTERNAL,
					ephemeral: true,
				})
			}
		}
	}
})

/**
 * Creates and sends message to a channel where slash command was executed
 * @param {TextBasedChannel} channel Channel to send message
 */
async function CreateMessage(channel) {
	const embed = new EmbedBuilder()
		.setColor(MESSAGE.COLOR)
		.setTitle(MESSAGE.TITLE)
		.setDescription(MESSAGE.DESCRIPTION)
		.setFooter({
			text: "Last Chaos Bot by danx91"
		})
	
	const register = new ButtonBuilder()
		.setCustomId("register")
		.setLabel(MESSAGE.REGISTER)
		.setStyle(ButtonStyle.Success)

	const download = new ButtonBuilder()
		.setLabel(MESSAGE.DOWNLOAD)
		.setStyle(ButtonStyle.Link)
		.setURL(MESSAGE.CLIENT_URL)

	const actionRow = new ActionRowBuilder()
		.addComponents(register, download)

	if(channel === null) {
		console.log( "Error: Channel is null!" )
		return false
	}

	await channel.send({
		embeds: [embed],
		components: [actionRow]
	})

	return true
}

/**
 * Registers new user - first step: rules
 * @param {ButtonInteraction} interaction 
 */
async function RegisterUserStep1(interaction) {
	let fail = false

	if(!mysqlConnected) {
		throw Error("MySQL is not connected!")
	}

	await MySQLQuery({
		sql: `SELECT EXISTS(SELECT * FROM ${MYSQL.BOT_DATABASE}.users WHERE discord_id = ?) AS result;`,
		values: [interaction.user.id],
		timeout: 5000
	}).then(async data => {
		if(data.results[0].result == 1) {
			console.log(`Account already exists! User: ${interaction.user.tag}`)
			interaction.reply({
				content: REGISTER.ERROR_ACCOUNT_EXISTS,
				ephemeral: true
			})

			return Promise.reject()
		}
	}).then(data => {
		const aceept = new ButtonBuilder()
			.setCustomId("rules-accept")
			.setLabel(REGISTER.RULES_ACCEPT)
			.setStyle(ButtonStyle.Success)

		const actionRow = new ActionRowBuilder()
			.addComponents(aceept)

		interaction.reply({
			content: REGISTER.RULES_CONTENT,
			components: [actionRow],
			ephemeral: true
		})
	}).catch(err => {
		if(err) {
			fail = true
			console.error(err)
			console.error("Error occurred in promise (RegisterUserStep1 function)!")
		}
	})

	if(fail === true) {
		throw Error("Operation failed (RegisterUserStep1)!")
	}
}

/**
 * Registers new user - second step: username and password
 * @param {ButtonInteraction} interaction 
 */
async function RegisterUserStep2(interaction) {
	let fail = false

	if(!mysqlConnected) {
		throw Error("MySQL is not connected!")
	}

	await MySQLQuery({
		sql: `SELECT EXISTS(SELECT * FROM ${MYSQL.BOT_DATABASE}.users WHERE discord_id = ?) AS result;`,
		values: [interaction.user.id],
		timeout: 5000
	}).then(async data => {
		if(data.results[0].result == 1) {
			console.log(`Account already exists! User: ${interaction.user.tag}`)
			await interaction.reply({
				content: REGISTER.ERROR_ACCOUNT_EXISTS,
				ephemeral: true
			})

			return Promise.reject()
		}
	}).then(async data => {
		const modal = new ModalBuilder()
			.setTitle(REGISTER.TITLE)
			.setCustomId("account-data")

		const username = new TextInputBuilder()
			.setCustomId("username")
			.setLabel(REGISTER.USERNAME)
			.setStyle(TextInputStyle.Short)
			.setMinLength(5)
			.setMaxLength(30)
			.setRequired(true)

		const password = new TextInputBuilder()
			.setCustomId("password")
			.setLabel(REGISTER.PASSWORD)
			.setStyle(TextInputStyle.Short)
			.setMinLength(8)
			.setMaxLength(16)
			.setRequired(true)

		const actionRow1 = new ActionRowBuilder().addComponents(username)
		const actionRow2 = new ActionRowBuilder().addComponents(password)

		modal.addComponents(actionRow1, actionRow2)
		await interaction.showModal(modal)
		//interaction
	}).catch(err => {
		if(err) {
			fail = true
			console.error(err)
			console.error("Error occurred in promise (RegisterUserStep2 function)!")
		}
	})

	if(fail === true) {
		throw Error("Operation failed (RegisterUserStep2)!")
	}
}

/**
 * Verify username and insert to database
 * @param {ModalSubmitInteraction} interaction 
 */
async function VerifyAccountData(interaction) {
	let fail = false

	if(!mysqlConnected) {
		throw Error("MySQL is not connected!")
	}

	const username = interaction.fields.getTextInputValue("username")
	const password = interaction.fields.getTextInputValue("password")

	if(!new RegExp(REGISTER.USERNAME_REGEX).test(username)) {
		console.log(`Invalid username! User: ${interaction.user.tag}, Username: ${username}`)
		await interaction.reply({
			content: REGISTER.ERROR_INVALID_USERNAME,
			ephemeral: true
		})

		return
	}

	if(!new RegExp(REGISTER.PASSWORD_REGEX).test(password)) {
		console.log(`Invalid password! User: ${interaction.user.tag}, Username: ${username}`)
		await interaction.reply({
			content: REGISTER.ERROR_INVALID_PASSWORD,
			ephemeral: true
		})

		return
	}

	const hash = crypto.createHash("md5").update(password).digest("hex")

	await MySQLQuery({
		sql: `SELECT EXISTS(SELECT * FROM ${MYSQL.LC_DATABASE}.bg_user WHERE user_id = ?) AS result;`,
		values: [username],
		timeout: 5000
	}).then(async data => {
		if(data.results[0].result == 1) {
			console.log(`Username already exists! User: ${interaction.user.tag}, Username: ${username}`)
			await interaction.reply({
				content: REGISTER.ERROR_USERNAME_EXISTS,
				ephemeral: true
			})

			return Promise.reject()
		}

		console.log(`Inserting new user! User: ${interaction.user.tag} (${interaction.user.id}), Username: ${username}, Hash: ${hash}`)

		return  MySQLQuery({
			sql: `INSERT INTO ${MYSQL.LC_DATABASE}.bg_user(user_id, passwd, create_date) VALUES (?, ?, NOW());`,
			values: [username, hash],
			timeout: 5000
		})
	}).then(data => {
		return MySQLQuery({
			sql: `INSERT INTO ${MYSQL.BOT_DATABASE}.users(discord_id, lc_id) VALUES (?, ?);`,
			values: [interaction.user.id, data.results.insertId],
			timeout: 5000
		})
	}).then(data => {
		console.log(`User created! User: ${interaction.user.tag} (${interaction.user.id}), Username: ${username}`)
		interaction.reply({
			content: REGISTER.SUCCESS,
			ephemeral: true
		})
	}).catch(err => {
		if(err) {
			fail = true
			console.error(err)
			console.error("Error occurred in promise (VerifyAccountData function)!")
		}
	})

	if(fail === true) {
		throw Error("Operation failed (VerifyAccountData)!")
	}
}