browser.storage.local.get('skills')
   .then((skillsData) => {
      showAllEntries(skillsData.skills);
      countSkills(skillsData.skills);
      document.getElementById('export-button').addEventListener('click',() => {
         console.log('Exporting...');
         const blob = new Blob([JSON.stringify(skillsData)], { type: "text/json" });
         const link = document.createElement("a");

         link.download = 'mySkils.json';
         link.href = window.URL.createObjectURL(blob);
         link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

         const evt = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
         });

         link.dispatchEvent(evt);
         link.remove()
      });   
}).catch((e) => {
   console.log("Initialization error");
   console.log(e);
});

//Upload file
document.getElementById('import-button').addEventListener('change', handleFiles, false);
   function handleFiles(){
      console.log('Importing...');
      const filelist = this.files;
      const selectedFile = filelist[0];
      selectedFile.text().then(text => {
         console.log('contents of the file:');
         console.log(text);
         try{
            var skillsObj = JSON.parse(text);
            console.log('parsed file:');
            console.log(skillsObj);
         }catch(e){
            console.log('Error parsing file');
            console.log(e);
            return;
         }
         browser.storage.local.set({'skills' : skillsObj.skills})
         .then(() => {
            showAllEntries(skillsObj.skills);
            countSkills(skillsObj.skills);
            console.log('Skills set');
         });       
      });
   }

/**
 * Displays all entries of skills on addon page.
 */
function showAllEntries(skillsArray){
   let curSkillContainer = document.getElementById('all-skills-table');
   curSkillContainer.innerHTML = '';
   curSkillContainer.re
   for (var i = 0; i < skillsArray.length; i++){   
      let newRow = document.createElement('tr');
      let newSkillName = document.createElement('td');
      let newURL = document.createElement('td');
      let newDate = document.createElement('td');
      newSkillName.innerText = skillsArray[i].skill;
      newURL.innerText = skillsArray[i].uri;
      newDate.innerText = skillsArray[i].date;
      newRow.append(newSkillName);
      newRow.append(newURL);
      newRow.append(newDate);
      curSkillContainer.append(newRow);
   }
}

/**
 * Counts skill stats and displays them on stats page
 * @param {array from localstorage} skillsArray 
 */
function countSkills(skillsArray){
   console.log('Counting skills');
   //count duplicates
   countedSkills = [];
   
   for (var i = 0; i < skillsArray.length; i++){
      //check if element alreadu exists  
      const found = countedSkills.findIndex(element => element.skillName == skillsArray[i].skill);
      console.log('found: ' + found);
      if (found != -1){
         console.log('increasing index; ');
         countedSkills[found].skillCount += 1;
      }
      else{
         newSkill = {
            'skillName': skillsArray[i].skill,
            'skillCount': 1
         }
         countedSkills.push(newSkill);
      }
   }
   //sort countedSkills
   countedSkills.sort(function(a, b){
      return b.skillCount - a.skillCount;
   });
   //print it all
   let sortedSkillContainer = document.getElementById('sorted-skills-container');
   sortedSkillContainer.innerHTML = '';
   for (var i = 0; i < countedSkills.length; i++){
      let newRow = document.createElement('tr');
      let newSkillName = document.createElement('td');
      let newCount = document.createElement('td');
      newSkillName.innerText = countedSkills[i].skillName;
      newCount.innerText = countedSkills[i].skillCount;
      newRow.append(newSkillName);
      newRow.append(newCount);
      sortedSkillContainer.append(newRow);   
   }

}