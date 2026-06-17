import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function App() {
  const [modelo, setModelo] = useState("");
  const [marca, setMarca] = useState("");
  const [ano, setAno] = useState("");
  const [pneu, setPneu] = useState("");
  const [calibragem, setCalibragem] = useState("");
  const [peso, setPeso] = useState("");
  const [combustivel, setCombustivel] = useState("");
  const [km, setKm] = useState("");
  const [resultado, setResultado] = useState<any>(null);

  const analisar = () => {
    let consumo = 12;
    let saude = 95; 
    let desempenho = "Bom";
    let categoria = "Uso Urbano";
  
    if (combustivel.toLowerCase() === "etanol") {
      consumo = 8;
    } else if (combustivel.toLowerCase() === "diesel") {
      consumo = 15;
    }

    if (Number(peso) > 1500) {
      consumo -= 2;
      desempenho = "Médio";
      categoria = "SUV";
    }
  
    if (Number(km) > 100000) {
      saude = 75;
    } else if (Number(km) > 50000) {
      saude = 85;
    }
  
    if (Number(calibragem) < 28) {
      consumo -= 1;
    }
  
    setResultado({
      desempenho,
      saude: `${saude}%`,
      consumo: `${consumo} km/L`,
      categoria,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>🏎 Simulador Automotivo</Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Modelo do carro"
          placeholderTextColor="#999"
          value={modelo}
          onChangeText={setModelo}
        />

        <TextInput
          style={styles.input}
          placeholder="Marca"
          placeholderTextColor="#999"
          value={marca}
          onChangeText={setMarca}
        />

        <TextInput
          style={styles.input}
          placeholder="Ano"
          keyboardType="numeric"
          placeholderTextColor="#999"
          value={ano}
          onChangeText={setAno}
        />

        <TextInput
          style={styles.input}
          placeholder="Tipo de pneu"
          placeholderTextColor="#999"
          value={pneu}
          onChangeText={setPneu}
        />

        <TextInput
          style={styles.input}
          placeholder="Calibragem (PSI)"
          keyboardType="numeric"
          placeholderTextColor="#999"
          value={calibragem}
          onChangeText={setCalibragem}
        />

        <TextInput
          style={styles.input}
          placeholder="Combustível"
          placeholderTextColor="#999"
          value={combustivel}
          onChangeText={setCombustivel}
        />

        <TextInput
          style={styles.input}
          placeholder="Quilometragem"
          keyboardType="numeric"
          placeholderTextColor="#999"
          value={km}
          onChangeText={setKm}
        />

        <TouchableOpacity style={styles.botao} onPress={analisar}>
          <Text style={styles.textoBotao}>🔍 Analisar Veículo</Text>
        </TouchableOpacity>
      </View>

      {resultado && (
        <View style={styles.relatorio}>
          <Text style={styles.tituloRelatorio}>
            📊 Relatório do Veículo
          </Text>

          <Text style={styles.item}>🚗 {marca} {modelo}</Text>
          <Text style={styles.item}>📅 Ano: {ano}</Text>
          <Text style={styles.item}>⚡ Desempenho: {resultado.desempenho}</Text>
          <Text style={styles.item}>🔧 Saúde do Motor: {resultado.saude}</Text>
          <Text style={styles.item}>⛽ Consumo: {resultado.consumo}</Text>
          <Text style={styles.item}>🏁 Categoria: {resultado.categoria}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 50,
  },

  titulo: {
    color: "#ff3b3b",
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  card: {
    margin: 15,
    padding: 20,
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
  },

  input: {
    backgroundColor: "#2c2c2c",
    color: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },

  botao: {
    backgroundColor: "#ff3b3b",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },

  textoBotao: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },

  relatorio: {
    margin: 15,
    padding: 20,
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ff3b3b",
  },

  tituloRelatorio: {
    color: "#ff3b3b",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },

  item: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
  },
});