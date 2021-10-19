const Discord = require("discord.js");
const db = require("quick.db");
const table = new db.table("Tickets");

let guildid = "" // sunucu id
let log = "" // log kanalı id
let prefix = "" // prefix
let modroles = "" // moderatör rolü
let botrole = "" //bot rolü
let ticketCategory = "" // ticket kategori id
let token = "" //botunuz tokeni

const client = new Discord.Client();

client.on("ready", () => {
  console.log(`Başarıyla Aktif Edildi! ${client.user.tag}.`)
  console.log(`Sunucu ID: ${guildid}\nLog Kanalı ID: ${log}\nPrefix: ${prefix}`)
  client.user.setActivity(`Estawky ModMail Bot || ${prefix}yardım`)
})

client.on("message", async message => {
  
  if(message.channel.type === "dm"){
    const dbTable = new db.table("Tickets");
    if(message.author.bot) return;
    if(message.content.includes("@everyone") || message.content.includes("@here")) return message.author.send("everyone yada here den bahsemedzsin!")
    let active = await dbTable.get(`support_${message.author.id}`)
    let guild = client.guilds.cache.get("SUNUCU İD"); // BUNU GİRMEYİ UNUTMAYIN!!!!!!
    let channel, found = true;
    
    let user = await dbTable.get(`isBlocked${message.author.id}`);
    if(user === true || user === "true") return message.react("❌");
    
    if(active === null){
      active = {};
      let modrole = guild.roles.cache.get(modroles);
      let everyone = guild.roles.cache.get(guild.roles.everyone.id);
      let bot = guild.roles.cache.get(botrole);
      
      await dbTable.add("ticket", 1)
      let actualticket = await dbTable.get("ticket");
      channel = await guild.channels.create(`${message.author.username}-${message.author.discriminator}`, { type: 'text', reason: `Modmail ticket oluşturuldu! #${actualticket}.` });
      channel.setParent(ticketCategory);
      channel.setTopic(`#${actualticket} (Aç) | ${prefix}işlem tamamlanınca ticketi kapatın! | Modmail for ${message.author.username}`)
      channel.createOverwrite(modrole, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: true,
        READ_MESSAGE_HISTORY: true
      });
      channel.createOverwrite(everyone, {
        VIEW_CHANNEL: false
      });
      channel.createOverwrite(bot, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: true,
        READ_MESSAGE_HISTORY: true,
        MANAGE_MESSAGES: true
      })
      let author = message.author;
      const newTicket = new Discord.MessageEmbed()
	.setColor("GREEN").setAuthor(author.tag, author.avatarURL({dynamic: true}))
  .setDescription(`Yeni ticket oluşturuldu, Oluşturan kişi ${author.tag}`)
	.addField("Ticket no.", actualticket, true)
  .setTimestamp()
  
	
      if(log){
	client.channels.cache.get(log).send({embed: newTicket})
      }
      const newChannel = new Discord.MessageEmbed()
        .setColor("BLUE")
        .setDescription(`Ticket #${actualticket} oluşturuldu.\nKullanıcı: ${author}\nID: ${author.id}`)
        .setTimestamp()
      await client.channels.cache.get(channel.id).send({embed:newChannel});
      message.author.send(`Merhaba, ${author.username}, ticket #${actualticket} Oluşturuldu!`)
      let logChannel = guild.channels.cache.get(log);
      logChannel.send({embed:newTicket})
      active.channelID = channel.id;
      active.targetID = author.id;
    }
    channel = client.channels.cache.get(active.channelID);
    var msg = message.content;
    var whatWeWant = msg.replace("@everyone", "[everyone]").replace("@here", `[here]`) 
  
    var isPaused = await dbTable.get(`suspended${message.author.id}`);
    var isBlocked = await dbTable.get(`isBlocked${message.author.id}`);
    if(isPaused === true){
    	return message.channel.send("Üzgünüz, ancak biletiniz şu anda duraklatıldı. Destek ekibi duraklatmayı kaldırdığında size mesaj atacağım.")
    }
    if(isBlocked === true) return; 
    if(message.attachments.size > 0){
      let attachment = new Discord.MessageAttachment(message.attachments.first().url)
      const userQuery = new Discord.MessageEmbed()
	      .setColor("GREEN")
	      .setTitle(`Mesajınız Alındı!`)
        .setDescription(`${whatWeWant}`)
        .setImage(message.attachments.first().url)
        .setTimestamp()
        .setFooter(msg.author.id)
      message.react("✅");
      client.channels.cache.get(active.channelID).send({embed:userQuery})
    } else {
      const userQuery = new Discord.MessageEmbed()
	      .setColor("GREEN")
	      .setTitle(`Mesajınız Alındı!`)
        .setDescription(`${whatWeWant}`)
        .setFooter(`${message.author.tag} • ${message.author.id} `)
        .setTimestamp()
      message.react("✅");
      client.channels.cache.get(active.channelID).send({embed:userQuery})
    }
    await dbTable.set(`support_${message.author.id}`, active);
    await dbTable.set(`supportChannel_${active.channelID}`, message.author.id);
    return;
  }
  if(message.author.bot) return;
  var table = new db.table("Tickets");
  var support = await table.get(`supportChannel_${message.channel.id}`);
  if(support){
    var support = await table.get(`support_${support}`);
    let supportUser = client.users.cache.get(support.targetID);
    if(!supportUser) return message.channel.delete();
    

    if(message.content.toLowerCase().startsWith(`${prefix}cevap`)){
      var isPause = await table.get(`suspended${support.targetID}`);
      let isBlock = await table.get(`isBlocked${support.targetID}`);
      if(isPause === true) return message.channel.send("Bu bilet zaten duraklatıldı. Devam etmek için biletinizi açın.")
      if(isBlock === true) return message.channel.send("Kullanıcı engellendi. Bileti devam ettirmek veya kapatmak için engelini kaldırın.")
      var args = message.content.split(" ").slice(1)
      let msg = args.join(" ");
      message.react("✅");
      const newReply = new Discord.MessageEmbed()
	      .setColor("GREEN").setAuthor(message.author.username, message.author.avatarURL({dynamic: true}))
        .setDescription(`${msg}`)
        .setFooter(`Estawky Modmail` )
        .setTimestamp()
      
	      
      if(message.attachments.size > 0){
        
        let attachment = new Discord.MessageAttachment(message.attachments.first().url)
        const newImageReply = new Discord.MessageEmbed()
	      .setColor("GREEN").setAuthor(message.author.username, author.avatarURL({dynamic: true}))
	      .setTitle(`${message.author}`)
        .setDescription(`${msg}`)
        .setImage(message.attachments.first().url)
        .setTimestamp()
        return supportUser.send({embed:newImageReply});
      } else {
        return supportUser.send({embed:newReply});
      }
    };
    
    if(message.content.toLowerCase().startsWith(`${prefix}acevap`)){
      var isPause = await table.get(`suspended${support.targetID}`);
      let isBlock = await table.get(`isBlocked${support.targetID}`);
      if(isPause === true) return message.channel.send("Bu bilet zaten duraklatıldı. Devam etmek için biletinizi açın.")
      if(isBlock === true) return message.channel.send("Kullanıcı engellendi. Bileti devam ettirmek veya kapatmak için engelini kaldırın.")
      var args = message.content.split(" ").slice(1)
      let msg = args.join(" ");
      message.react("✅");
      const anonReply = new Discord.MessageEmbed()
	      .setColor("BLUE")
	      .setTitle(`Moderatör Takımı`)
        .setDescription(`${msg}`)
        .setFooter(`Estawky ModMail`)
        .setTimestamp()
        return supportUser.send({embed:anonReply});
      
    };
    if(message.content.toLowerCase() === `${prefix}öbitir`){
      const closeWarn = new Discord.MessageEmbed()
      .setTitle(`Moderatör Takımı`)
      .setDescription(`Şimdi bu konuyu sizin için kapatacağız. İyi günler/akşamlar, herhangi bir sorunuz veya sorununuz olursa bizimle iletişime geçmekten çekinmeyin.`)
      .setFooter(`Yetkili`)
      .setTimestamp()
      message.react("✅");
        return supportUser.send({embed: closeWarn})
    }
    

    if(message.content.toLowerCase() === `${prefix}id`){
      return message.channel.send(`Kullanıcı IDsi **${support.targetID}**.`);
    };

    if(message.content.toLowerCase() === `${prefix}durdur`){
      var isPause = await table.get(`suspended${support.targetID}`);
      if(isPause === true || isPause === "true") return message.channel.send("Bu bilet zaten duraklatıldı. Devam etmek için biletinizi açın.")
      await table.set(`suspended${support.targetID}`, true);
      var suspend = new Discord.MessageEmbed()
      .setDescription(`⏸️ Bu konu **kilitlendi** ve **askıya alındı**.  İptal etmek için \`${prefix}devam\``)
      .setTimestamp()
      .setColor("YELLOW")
      message.channel.send({embed: suspend});
      return client.users.cache.get(support.targetID).send("Biletiniz duraklatıldı. Devam etmeye hazır olduğumuzda size bir mesaj göndereceğiz.")
    };
    

    if(message.content.toLowerCase() === `${prefix}devam`){
      var isPause = await table.get(`suspended${support.targetID}`);
      if(isPause === null || isPause === false) return message.channel.send("Bu bilet duraklatılmadı.");
      await table.delete(`suspended${support.targetID}`);
      var c = new Discord.MessageEmbed()
      .setDescription("▶️ Bu konu **kilidi açıldı**.")
      .setColor("BLUE").setTimestamp()
      message.channel.send({embed: c});
      return client.users.cache.get(support.targetID).send("Selam! Biletiniz artık duraklatılmadı. Devam etmeye hazırız!");
    }
    

    if(message.content.toLowerCase().startsWith(`${prefix}engelle`)){
    var args = message.content.split(" ").slice(1)
	  let reason = args.join(" ");
	  if(!reason) reason = `Belirtilmemiş.`
	  let user = client.users.fetch(`${support.targetID}`); 
	  const blocked = new Discord.MessageEmbed()
		.setColor("RED").setAuthor(user.tag)
		.setTitle("Kullanıcı Engellendi!")
		.addField("Kanal", `<#${message.channel.id}>`, true)
		.addField("Sebep", reason, true)
    .setTimestamp()
	  if(log){
	    client.channels.cache.get(log).send({embed: blocked})
	  }
      let isBlock = await table.get(`isBlocked${support.targetID}`);
      if(isBlock === true) return message.channel.send("Kullanıcı zaten engellenmiş.")
      await table.set(`isBlocked${support.targetID}`, true);
      var c = new Discord.MessageEmbed()
      .setDescription("⏸️ Kullanıcı modmail'den engellendi. Şimdi devam etmek için bileti kapatabilir veya engelini kaldırabilirsiniz.")
      .setColor("RED").setTimestamp()
      message.channel.send({embed: c});
      return;
    }
    
  

    if(message.content.toLowerCase() === `${prefix}bitir`){
        var embed = new Discord.MessageEmbed()
        .setDescription(`Bu bilet **10** saniye içinde silinecek...\n:lock: Bu konu kilitlendi ve kapatıldı.`)
        .setColor("RED").setTimestamp()
        message.channel.send({embed: embed})
        var timeout = 10000
        setTimeout(() => {end(support.targetID);}, timeout)
        const closedTicket = new Discord.MessageEmbed()
	      .setColor("RED")
	      .setTitle(message.channel.name)
        .setDescription(`Ticket ${message.author.tag} Tarafından Kapatıldı!`)
        .setTimestamp()
        let guild = client.guilds.cache.get(guildid);
        let logChannel = guild.channels.cache.get(log);
        logChannel.send({embed: closedTicket})
      }
      async function end(userID){
        table.delete(`support_${userID}`);
        let actualticket = await table.get("ticket");
        message.channel.delete()
        return client.users.cache.get(support.targetID).send(`#${actualticket} numaralı biletiniz kapatıldı! Yeni bir bilet açmak isterseniz, bana mesaj atmaktan çekinmeyin.`)
      }
    };
})
client.on('message', async message =>{
  if(message.author.bot) return false;
  if(message.content.includes("@here") || message.content.includes("@everyone")) return false;
  if(message.mentions.has(client.user.id)){
    message.reply(`Prefixim **${prefix}**,Yardım için ${prefix}yardım.`)
  }
    
  
})
client.on('message', async message => {
  if(message.content.toLowerCase().startsWith(`${prefix}yardım`)){
        var embedd = new Discord.MessageEmbed()
          .setTitle(`Yardım Menüsü`)
          .setDescription(`Prefixim ${prefix}`)
          .addField(`${prefix}cevap`, `tickete cevap verirsiniz.`, false)
          .addField(`${prefix}acevap`, `tickete anonim bir şekilde cevap verirsiniz.`, false)
          .addField(`${prefix}engelle`, `kullanıcıyı engellersiniz.`, false)
          .addField(`${prefix}durdur`, `kullanıcıdan mesaj almayı durdurursunuz.`, false)
          .addField(`${prefix}devam`, `tickete devam edersiniz`, false)
          .addField(`${prefix}öbitir`, `özel bir bitiriş selam göndermek için.`, false)
          .addField(`${prefix}bitir`, `ticketi kapatırsınız.`, false)
          .addField(`${prefix}ping`, `botun pigini ölçersiniz.`, false)
          .addField(`${prefix}engelkaldır`, `engellenmiş kullanıcının engelini kaldırırsınız.`, false)
          .setColor("YELLOW")
          .setTimestamp()
        message.channel.send({embed: embedd})
      }
  
})
client.on("message", async message =>{
  if(message.content.toLowerCase().startsWith(`${prefix}ping`)){
    message.reply('Ping Ölçülüyor...').then(resultMessage =>{
      const ping = resultMessage.createdTimestamp - message.createdTimestamp
      
      message.reply(`Pong :ping_pong: !\nBot Gecikme Süresi: ${ping}ms, API Gecikme Süresi: ${client.ws.ping}ms`)
    })
  }
})
client.on("message", async message => {
  if(message.content.toLowerCase().startsWith(`${prefix}engelkaldır`)){
    if(message.guild.member(message.author).roles.cache.has(modrole)){
      var args = message.content.split(" ").slice(1);
      client.users.fetch(`${args[0]}`).then(async user => {
      	let data = await table.get(`isBlocked${args[0]}`);
        if(data === true){
          await table.delete(`isBlocked${args[0]}`);
                return message.channel.send(`${user.username} (${user.id})'nin modmail hizmetinden engellemesi başarıyla kaldırıldı.`);
        } else {
          return message.channel.send(`${user.username} (${user.id}) şu anda modmail'den engellenmiyor.`)
        }
            }).catch(err => {
              if(err) return message.channel.send("Kullanıcı bulunamadı.");
            })
    } else {
      return message.channel.send("D-Dostum Bunu Yapamazsın.");
    }
  }  
})

client.login(token);
