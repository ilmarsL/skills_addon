(function() {
/**
* Check and set a global guard variable.
* If this content script is injected into the same page again,
* it will do nothing next time.
*/
try{
if (window.hasRun) {
    console.log('has run detected!');
    return;
}
window.hasRun = true;  



console.log('My content script');
var skillsArray = [];

browser.runtime.onMessage.addListener((message) => {
    if (message.command === "button") {
        console.log('Button pressed');

   
        let exactText = window.getSelection().toString();  
        skillsArray.push(exactText);      
       
        console.log('selected text: ' + exactText);
        console.log('array content:');
        console.log(skillsArray);
        
        let skill = {
            skillName: exactText,
            uri: document.documentURI,
            date: Date()
        }
        return Promise.resolve({skill});
    }
    else if (message.command === "buttonSave") {
        console.log('Save button pressed');  
       
        console.log('Saving: ');
        console.log(skillsArray);
    }
});
}catch(e){
    console.log('Caught error in content script');
    console.log(e);
}

})();