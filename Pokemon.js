'use strict'
// 1行目に記載している 'use strict' は削除しないでください
// オブジェクトの入れ子 {"Number": {"Name": 名前, "Types": タイプ, "About": 説明}}
const allData = {};
for (const pokemon of allPokemon){
  allData[pokemon.Number] = {
    Name: pokemon.Name,
    Types: pokemon.Types,
    About: pokemon.About
  };
}
  
let myTable = document.createElement("table");
myTable.classList.add("modern-table");
let myTr = document.createElement("tr");
let columns = ["番号", "名前", "タイプ", "身長", "体重", "説明"];

for (const column of columns){
  let myTh = document.createElement("th");
  myTh.innerText = column;
  if (column !== "説明"){
    myTh.style.width = "100px";
  }else{
    myTh.style.width = "600px";
  }
  myTr.append(myTh);
}

myTable.appendChild(myTr);
const indexs = ["Number", "Name", "Types", "Height", "Weight", "About"];
for (const pokemon of allPokemon){
  const myTr = document.createElement("tr");
  for (const index of indexs){
    const myTh = document.createElement("th");
    if (index === "Number"){
      myTh.innerText = pokemon[index];
    }else if (index === "Types"){
      const i = pokemon["Number"];
      // console.log(i);
      // console.log(typeof allData[i]);
      for (const type of allData[i].Types){
        myTh.innerText += type + " ";
      }
    }else if (index === "Weight"){
      const minimumW = pokemon[index]["Minimum"].replace("kg","");
      const maximumW = pokemon[index]["Maximum"].replace("kg","");
      let result = (Number(minimumW) + Number(maximumW))/2;
      result = result.toFixed(1);
      myTh.innerText = String(result)+"kg";
    }else if (index === "Height"){
      const minimumH = pokemon[index]["Minimum"].replace("m","");
      const maximumH = pokemon[index]["Maximum"].replace("m","");
      let result = (Number(minimumH) + Number(maximumH))/2;
      result = result.toFixed(1);
      myTh.innerText = String(result)+"m";
    }else{
      const i = pokemon["Number"];
      myTh.innerText = allData[i][index];
    }
    myTr.append(myTh);
  }
  myTable.append(myTr);
}
document.body.appendChild(myTable);
