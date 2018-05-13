var nodemailer = require('nodemailer');

var transport = nodemailer.createTransport({
    service: "hotmail",
    auth: {
        user: "email@mail.com",
        pass: "*************"
    }
});

// verify connection configuration
transport.verify(function (error, success) {
    if (error) {
        console.log(error);
    } else {
        console.log('Server is ready to take our messages');
    }
});

module.exports = {
     message : {
        from: 'Mohit.salecha@outlook.com',
        to: 'mohitj786@gmail.com',
        subject: 'Node Training Message',
        text: 'Plaintext version of the message',
        html: '<p>HTML version of the message</p>'
    },

    sendTestEmail: function () {
        transport.sendMail(message, function (msg, error) {
            if (error) {
                console.log(error);
            }
            console.log("email sent.");

        });
    },

    sendRegistrationMail: function (userEmail, username, password) {
        this.message.to = userEmail;
        this.message.subject = "Successfully register on Node application";
        this.message.html = `<center>
                    <h3>Thanks for Registering in out application</h3>
                    <lable>UserName: ${username}</label>
                    <br />
                    
                    <lable>Password:${password} </label>
                    
                    </cender>
                    `

        setTimeout(() => {
            this.sendEmail(this.message);
        }, 1 * 60 * 1000);

    },

    sendEmail: function (message) {
        transport.sendMail(message, function (msg, error) {
            if (error) {
                console.log(error);
            }
            console.log("email sent.");

        });
    }
}
// setInterval(sendEmail,60*1000);
