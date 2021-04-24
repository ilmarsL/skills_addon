browser.storage.local.get('skills')
.then((skillsData) => {
   for (var i = 0; i < skillsData.skills.length; i++){
       let curSkillContainer = document.getElementById('all-skills');
       let newSkill = document.createElement('li');             
       newSkill.innerText = skillsData.skills[i].skill;
       curSkillContainer.append(newSkill);
   }
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

   document.getElementById('export-button').addEventListener('click',() => {
      console.log('Importing...');
      const selectedFile = document.getElementById('input').files[0];
   });
   
        
});