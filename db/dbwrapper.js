
const fs = require('fs');
var path = require('path');
const dbpath = path.join(__dirname, '..', 'db', 'dbfile.txt');

module.exports = {
    CheckUser : function(username, pass){
        let users= this.GetAllUsers();
        let user = null;
        users.forEach(element=>{
            if((element.UserName === username || element.PriEmail === username)
                 && (pass === element.Password || pass === element.PhoneNo)){
                    user = element;
                    
                 }
        });

        return user;
    },

    GetUserById : function(id){
        let users = this.GetAllUsers();
        let user = null;
        users.forEach(element => {
            if(element.id === id){
                user = element;
            }
        });
        return user;
    },

    GetAllUsers : function(){
        let data = fs.readFileSync(dbpath, 'utf8');
        let users = JSON.parse(data) || [];
        return users;
      
    },

    SaveUser : function(user){
        let users = this.GetAllUsers();
        let maxId = 0;
        users.forEach(element => {
            if(element.id > maxId) maxId = element.id;
        });
        user.id  =maxId+1;
        users.push(user);
        fs.writeFileSync(dbpath, JSON.stringify(users));
    },

    DeleteUser :function(id){
        let users = this.GetAllUsers();
        users.forEach(element => {
            if(element.id === id){
                users.pop(element);
            }
        });
        fs.writeFileSync(dbpath, JSON.stringify(users));

    }

}