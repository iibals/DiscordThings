client.on('messageCreate', async (message) => {
  // التأكد من أن الرسالة ليست من البوت نفسه
  if (message.author.bot) return;

  // التحقق إذا كانت الرسالة هي "clear"
  if (message.content.toLowerCase() === '$clear') {
      // محاولة حذف الرسائل
      try {
          let deletedMessages = 0;

          // جلب وحذف الرسائل في أجزاء من 100 حتى نصل إلى 20
          while (deletedMessages < 20 ) {
              const fetchedMessages = await message.channel.messages.fetch({ limit: 100 });
              if (fetchedMessages.size === 0) break;

              for (const msg of fetchedMessages.values()) {
                  await msg.delete();
                  deletedMessages++;

                  // تحقق إذا وصلنا إلى حد 20 رسالة
                  if (deletedMessages >= 20) break;

                  // انتظار فترة قصيرة لتجنب مشاكل المعدل
                  await new Promise(resolve => setTimeout(resolve, 100));
              }
          }

          if (deletedMessages > 1) {
              console.log(`Deleted ${deletedMessages} messages.`);
              message.channel.send(`تم حذف ${deletedMessages} رسالة`+ " استخدم clear$ في اي شات لحذف 20 رسالة متتالية تجنبًا للسبام كرر الطلب في حال تبي" );
          } else {
              message.channel.send("سيتم الحذف");
          }
      } catch (error) {
          console.error('Error deleting messages:', error);
          message.channel.send('YOURS');
      }
  }
});
if (message.content.startsWith('$معاقبين')) {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection from pool:', err);
      message.reply('حدث خطأ أثناء الاتصال بقاعدة البيانات.');
      return;
    }

    const currentDate = new Date();

    connection.query(
      'SELECT * FROM penalties WHERE end_date > ? ORDER BY end_date ASC',
      [currentDate],
      (err, results) => {
        connection.release();
        if (err) {
          console.error('Error querying the database:', err);
          message.reply('حدث خطأ أثناء الاستعلام من قاعدة البيانات.');
          return;
        }

        if (results.length === 0) {
          message.reply('لا يوجد أعضاء معاقبين حالياً.');
          return;
        }

        let replyMessage = 'قائمة الأعضاء المعاقبين حالياً:\n';

        results.forEach((penalty, index) => {
          const endDate = new Date(penalty.end_date);
          const remainingDays = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
          const userId = penalty.user_id;
          const reason = penalty.reason;

          // استخدام التقويم الميلادي مع اللغة العربية
          replyMessage += `${index + 1}. <@${userId}> - السبب: ${reason} - المدة المتبقية: ${remainingDays} يوم - تنتهي في: ${endDate.toLocaleDateString('ar-SA', { calendar: 'gregory' })}\n`;
        });

        if (replyMessage.length >= 2000) {
          message.reply('عدد الأعضاء المعاقبين كبير جداً لعرضه في رسالة واحدة.');
        } else {
          message.reply(replyMessage);
        }
      }
    );
  });
}



});


function removeExpiredPenalties() {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection from pool:', err);
      return;
    }

    const now = new Date();

    connection.query(
      'SELECT * FROM penalties WHERE end_date <= ? AND notified = FALSE',
      [now],
      async (err, results) => {
        if (err) {
          connection.release();
          console.error('Error querying expired penalties:', err);
          return;
        }

        for (const penalty of results) {
          const guild = client.guilds.cache.first(); // افتراض أن البوت في خادم واحد فقط
          const member = await guild.members.fetch(penalty.user_id).catch(() => null);

          if (member) {
            await member.roles.remove(punishedRoleId);
            await member.roles.add(penalty.original_role);

            client.channels.cache.get(channelId).send(
              `انتهت عقوبة ${member}. تمت إعادة الرتبة الأصلية.`
            );

            // تحديث السجل لتعيين notified إلى TRUE
            connection.query(
              'UPDATE penalties SET notified = TRUE WHERE id = ?',
              [penalty.id],
              (updateErr) => {
                if (updateErr) {
                  console.error('Error updating penalty as notified:', updateErr);
                }
              }
            );
          }
        }

        connection.release();
      }
    );
  });
}

setInterval(removeExpiredPenalties, 60 * 60 * 1000); // تشغيل كل ساعة NEW ONE

// Forgive code
client.on('messageCreate', async (message) => {
    if (message.content.startsWith('$سامح')) {
        const args = message.content.split(' ');
        const member = message.mentions.members.first();

        if (!member) {
            message.reply('يرجى منشن العضو للسماح له.');
            return;
        }

        if (!message.member.roles.cache.has(policeRoleId)) {
            message.reply('يجب أن تكون شرطي لتنفيذ هذا الأمر.');
            return;
        }

        const botMember = await message.guild.members.fetch(client.user.id);
        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
            message.reply('البوت ليس لديه الأذونات الكافية لإدارة الأدوار.');
            return;
        }

        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting connection from pool:', err);
                message.reply('حدث خطأ أثناء الاتصال بقاعدة البيانات.');
                return;
            }

            // الحصول على العقوبة الحالية للعضو
            connection.query('SELECT * FROM penalties WHERE user_id = ? AND notified = FALSE', [member.id], async (err, results) => {
                if (err) {
                    connection.release();
                    console.error('Error querying the database:', err);
                    message.reply('حدث خطأ أثناء الاستعلام من قاعدة البيانات.');
                    return;
                }

                if (results.length > 0) {
                    const penalty = results[0]; // نفترض وجود عقوبة واحدة نشطة لكل عضو

                    // تحديث العقوبة لتعيين notified إلى TRUE وتحديث end_date إلى الآن
                    const now = new Date();
                    connection.query('UPDATE penalties SET notified = TRUE, end_date = ? WHERE id = ?', [now, penalty.id], async (updateErr) => {
                        connection.release();
                        if (updateErr) {
                            console.error('Error updating penalty:', updateErr);
                            message.reply('حدث خطأ أثناء تحديث العقوبة في قاعدة البيانات.');
                            return;
                        }

                        try {
                            await member.roles.remove(punishedRoleId);
                            await member.roles.add(penalty.original_role);
                            message.reply(`تم السماح لـ ${member}`);
                        } catch (err) {
                            console.error('Error updating roles:', err);
                            message.reply('حدث خطأ أثناء تحديث الرتب.');
                        }
                    });
                } else {
                    connection.release();
                    message.reply('لا يوجد عقوبة فعالة لهذا العضو.');
                }
            });
        });
    }
});
