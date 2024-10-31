// Welcome things
const guildMemberAdd_welcomeRoleID = 'YOURS'; // معرف الرتبة للحدث guildMemberAdd
const guildMemberAdd_welcomeChannelID = 'YOURS'; // معرف القناة للحدث guildMemberAdd

client.on('guildMemberAdd', member => {
    const role = member.guild.roles.cache.get(guildMemberAdd_welcomeRoleID);
    if (role) {
        member.roles.add(role)
            .then(() => {
                console.log(`تم إضافة الرتبة "${role.name}" إلى العضو ${member.user.tag}`);
            })
            .catch(err => {
                console.error(`لم يتمكن البوت من إضافة الرتبة للعضو ${member.user.tag}:`, err);
            });
    } else {
        console.error(`لم يتم العثور على الرتبة بالمعرف ${guildMemberAdd_welcomeRoleID}`);
    }

    const welcomeChannel= member.guild.channels.cache.get(guildMemberAdd_welcomeChannelID);
    if (welcomeChannel) {
        welcomeChannel.send(`حياك الله ${member} اطلق من يجي`);
    } else {
        console.error(`لم يتم العثور على القناة بالمعرف ${guildMemberAdd_welcomeChannelID}`);
    }
});
