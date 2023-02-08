const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();



app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// connection to database MongoDB
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

// Schema Created
const itemsSchema = {
    name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your ToDo list!"
});
const item2 = new Item({
    name: "Hit the + Button of a new Item"
});
const item3 = new Item({
    name: "<-- Hit this to delete an Item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", (req, res) => {

    Item.find({}, function(err, foundItems){

        if(foundItems.length === 0){
                Item.insertMany(defaultItems, function(err){
        if (err) {
            console.log(err);
        }else{
            console.log("Successfully Saved Default Items to DB");
        }
    });
    res.redirect('/');
        }else{
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    });
});

app.post("/", (req, res) => {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName == "Today"){
    item.save();
    res.redirect("/");
    }else{
        List.findOne({name: listName}, function(err, foundlist) {
            foundlist.items.push(item);
            foundlist.save();
            res.redirect("/" + listName);
        });
    }

});

app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName == "Today"){
        Item.findByIdAndRemove(checkedItemId, function(err){
            if (!err) {
                console.log("Successfully deleted checked Item.");
                res.redirect("/");
            }else{
                console.log(err);
            }
        });
    }else{
         List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundlist){
            if(!err){
                res.redirect("/" + listName);
            }
         });
    }
});

app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundlist) {
        if(!err) {
            if(!foundlist){
                // Create a new List
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            }else{
                // Show an Existing List
                res.render("list",{listTitle: foundlist.name, newListItems: foundlist.items});
            }
        }
    });

    
});


app.get("/about", (req, res) => {
    res.render("about");
});

// app.post("/work", (req, res) => {
//     let item = req.body.newItem;
//     workItems.push(item);
//     res.redirect("/work");
// });


app.listen(3000, (req, res) => {
    console.log("Server is running at port 3000");
});