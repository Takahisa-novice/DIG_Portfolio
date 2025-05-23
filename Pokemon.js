'use strict'
// 1行目に記載している 'use strict' は削除しないでください

// 見出しの部分の作成
let head = document.getElementsByClassName("header")[0];
let myTable = document.createElement("table");
myTable.classList.add("modern-table");
let myTr = document.createElement("tr");
let columns = ["ID", "Name", "Image", "Types", "About"];

for (const column of columns){
  let myTh = document.createElement("th");
  myTh.innerText = column;
  if (column !== "About"){
    myTh.style.width = "100px";
  }else{
    myTh.style.width = "600px";
  }
  myTr.append(myTh);
}

myTable.appendChild(myTr);
let indexs = ["Number", "Name", "Image", "Types", "About"];
for (const pokemon of allPokemon){
  let myTr = document.createElement("tr");
  for (const index of indexs){
    let myTh = document.createElement("th");
    if (index === "Types"){
      for (const type of pokemon[index]){
        myTh.innerText += type + " ";
      }
    }else if (index === "About"){
      myTh.innerText = pokemon[index];
    }else if (index === "Image"){
      const img = document.createElement("img");
      img.src = "Image/" + pokemon["Number"] + ".png";
      img.style.width = "100px";
      img.style.height = "80px";
      myTh.appendChild(img);
    }else{
      myTh.innerText = pokemon[index];
    }
    myTr.append(myTh);
  }
  myTable.append(myTr);
}

document.body.appendChild(myTable);
