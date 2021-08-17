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
    console.log('My content script from windows, built using webext');
    var currentPageSkills = {}
    currentPageSkills.skillsArray = [];
    currentPageSkills.isSaved = true;

    browser.runtime.onMessage.addListener((message) => {
        if (message.command === "button") {
            //Add-skill button pressed
            console.log('Button pressed');   
            let exactText = window.getSelection().toString();       
        
            console.log('selected text: ' + exactText);
            console.log('array content:');
            console.log(currentPageSkills.skillsArray);
            
            let skill = {
                skillName: exactText,
                uri: document.documentURI,
                date: Date()
            }
            currentPageSkills.skillsArray.push(skill);
            currentPageSkills.isSaved = false; 
            return Promise.resolve({skill});
        }
        else if (message.command === "buttonSave") {
            //TODO Check if this still needed
            //"Save" button pressed 
            console.log('Save button pressed');       
            console.log('Saving: ');
            console.log(currentPageSkills.skillsArray);
            currentPageSkills.isSaved = true;
        }
        else if(message.command === "getCurrentSkills"){
            console.log('Returning current skills to popup: ');
            console.log(currentPageSkills);
            return Promise.resolve({currentPageSkills});
        }
    });
}catch(e){
    console.log('Caught error in content script');
    console.log(e);
}
})();