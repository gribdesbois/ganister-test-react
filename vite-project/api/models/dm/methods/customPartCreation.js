
module.exports = {
  id: 'method_b611c590-e357-11eb-beac-11bd7ff16829',
  package: 'core',
  name: 'customPartCreation',
  serverOrClient: 'client',
  code: `// this method is a promise, you need to return resolve or reject with the context object
// the context object is provided as an input.
// context input depends on the selected trigger (see documentation http://localhost:8008/help/tech/)
// Method name : cableCreationProcess
// Created On  : 07-12-2021 (1626124955695)
// Created by  : Test-Ganister
// Description : 
// ---------------------------------------------------------------------------------------------------

const customPreCreations = async () => {
  const preFields = {};
  const preQuestion = await Swal.fire({
    title: 'Créez vous un cable?',
    showDenyButton: true,
    confirmButtonText: \`Oui\`,
    denyButtonText: \`Non\`,
  })
  /* Read more about isConfirmed, isDenied below */
  if (!preQuestion.isConfirmed) {
    return {};
  } 
  const { value: formValues } = await Swal.fire({
    title: 'Calcul de référence de câble',
    html: \`
    <label> Forme Connecteur 1 </label>
  <select id="formCon1" class="swal2-input">
    <option value='D'>Droit</option>
    <option value='C'>Coudé</option>
  </select>
  <label> Format Connecteur 1 </label>
  <select id="formatCon1" class="swal2-input">
    <option value='A'>N</option>
    <option value='E'>7/16</option>
    <option value='I'>SMA</option>
    <option value='O'>TNC</option>
    <option value='M'>MMCX</option>
    <option value='Q'>4.3-10</option>
  </select>
  <label> Type Connecteur 1 </label>
  <select id="typeCon1" class="swal2-input">
    <option value='1'>Mâle</option>
    <option value='2'>Femelle</option>
    <option value='3'>Femelle traversant</option>
    <option value='4'>Femelle à embase carrée</option>
  </select>
  <label> Forme Connecteur 2 </label>
  <select id="formCon2" class="swal2-input">
    <option value='D'>Droit</option>
    <option value='C'>Coudé (même sens)</option>
    <option value='N'>Coudé nord (inverse)</option>
    <option value='O'>Coudé ouest (gauche)</option>
    <option value='E'>Coudé est (droit)</option>
  </select>
  <label> Format Connecteur 2 </label>
  <select id="formatCon2" class="swal2-input">
    <option value='A'>N</option>
    <option value='E'>7/16</option>
    <option value='I'>SMA</option>
    <option value='O'>TNC</option>
    <option value='M'>MMCX</option>
    <option value='Q'>4.3-10</option>
  </select>
  <label> Type Connecteur 2 </label>
  <select id="typeCon2" class="swal2-input">
    <option value='1'>Mâle</option>
    <option value='2'>Femelle</option>
    <option value='3'>Femelle traversant</option>
    <option value='4'>Femelle à embase carrée</option>
  </select>
  <label> Type Cable </label>
  <select id="typeCable" class="swal2-input">
    <option value='E'>ECOFLEX 10</option>
    <option value='U'>UT141</option>
    <option value='G'>RG223</option>
    <option value='D'>RG142</option>
    <option value='C'>CNT240</option>
    <option value='R'>RG316</option>
    <option value='F'>RF400</option>
    <option value='H'>ECOFLEX 15</option>
    <option value='L'>SFL 405-105</option>
    <option value='N'>SFL402-105</option>
    <option value='M'>LMR240</option>
    <option value='O'>LMR200</option>
    <option value='P'>CORDON DE MESURE RF</option>
  </select>
  <label> Longueur Cable (cm)</label>
  <input type="integer" id="longueur" class="swal2-input"/>
  <label> Type Connecteur 2 </label>
  <select id="divers" class="swal2-input">
    <option value='G'>Gaine Extérieure</option>
    <option value='M'>Manchon moulé</option>
  </select>
  \`,
    confirmButtonText: 'Créer',
    focusConfirm: false,
    preConfirm: () => {
      return [
        document.getElementById('formCon1').value,
        document.getElementById('formatCon1').value,
        document.getElementById('typeCon1').value,
        document.getElementById('formCon2').value,
        document.getElementById('formatCon2').value,
        document.getElementById('typeCon2').value,
        document.getElementById('typeCable').value,
        document.getElementById('longueur').value,
        document.getElementById('divers').value,
      ]
    }
  })

  if (formValues) {
    preFields._ref = formValues.join('');
  }

  return preFields;
}

const preFields = await customPreCreations();
data.preFields = preFields;

return data;

`,
  createdOn: 1626125142112,
  createdBy: {
    id: 'a99cf630-654f-11eb-a2e5-fd01fad4824a',
    name: 'Michel Duchois',
  },
  updatedOn: 1634815884885,
  updatedBy: {
    id: '5c1e6650-654f-11eb-a2e5-fd01fad4824a',
    name: 'undefined',
  },
}