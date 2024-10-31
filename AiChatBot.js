const { HfInference } = require('YOU_SOURCE');

const hf = new HfInference('YOURS');

client.on('messageCreate', async (message) => {
  if (message.author.bot || message.channel.id !== channelId) return;

  if (message.author.bot) return; // تجاهل الرسائل من البوتات الأخرى

  const userMessage = message.content;
  console.log(`Received message: ${userMessage}`);

  // تحقق مما إذا كانت الرسالة تحتوي على الأوامر التي نريد تجاهلها
   const ignoredCommands = [
      "$باقي",
      "$عاقب",
      "$clear",
      "$معاقبين",
      "$اوامر",
      "$سامح"
  ];
  if (ignoredCommands.some(command => userMessage.startsWith(command))) {
      console.log('Ignoring command:', userMessage);
      return;
  } else {
    try {
      const response = await hf.textGeneration({
        model: 'aubmindlab/aragpt2-medium', // نموذج يدعم اللغة العربية
        inputs: message.content,
        parameters: {
          max_new_tokens: 50,
          temperature: 0.7,
          do_sample: true,
        },
      });

      console.log(`Generated response: ${response.generated_text}`);

      let cleanResponse = response.generated_text.replace(message.content, '').trim();

      if (!cleanResponse || cleanResponse.match(/^[.,!?;:]+$/)) {
        cleanResponse = "عذرًا، لم أفهم. هل يمكنك إعادة صياغة سؤالك؟";
      }

      await message.reply(cleanResponse);
      console.log('Response sent successfully');
    } catch (error) {
      console.error('Error:', error);
      await message.reply('عذرًا، حدث خطأ أثناء معالجة الرسالة.');
    }
  }

});
