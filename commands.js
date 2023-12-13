const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const { CLIENT, GUILD, TOKEN } = require('./config.json')

const rest = new REST({ version: '10' }).setToken(TOKEN)

const commands = []

commands.push(new SlashCommandBuilder()
	.setName("last-chaos-spawn")
	.setDescription("Create message")
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.toJSON())

;(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`)

		const data = await rest.put(
			Routes.applicationGuildCommands(CLIENT, GUILD),
			{ body: commands },
		)

		console.log(`Successfully reloaded ${data.length} application (/) commands.`)
	} catch (error) {
		console.error(error)
	}
})()
