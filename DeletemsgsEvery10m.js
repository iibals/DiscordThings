
client.once('ready', () => {

    const musicChannelId = '1296284789296336966';

    async function deleteMessages() {
        const channel = await client.channels.fetch(musicChannelId);

        // حذف 10 رسائل
        const messages1 = await channel.messages.fetch({ limit: 10 });
        if (messages1.size > 0) {
            await channel.bulkDelete(messages1);
        }

        // الانتظار لمدة 10 ثواني
        await new Promise(resolve => setTimeout(resolve, 10000));

        // حذف 10 رسائل أخرى
        const messages2 = await channel.messages.fetch({ limit: 10 });
        if (messages2.size > 0) {
            await channel.bulkDelete(messages2);
        }
    }

    // تكرار العملية كل 10 دقائق
    setInterval(deleteMessages, 10 * 60 * 1000);

    // تشغيل العملية لأول مرة
    deleteMessages();

});
