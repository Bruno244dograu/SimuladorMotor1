import React, { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API = "https://fipe.parallelum.com.br/api/v2";

type ItemAPI = {
  code: string | number;
  name: string;
};

type DadosFipe = {
  vehicleType?: number;
  price: string;
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
  codeFipe: string;
  referenceMonth?: string;
};

type Resultado = {
  desempenho: string;
  saude: number;
  consumo: number;
  categoria: string;
  nota: number;
  classificacao: string;
  alertas: string[];
};

type SeletorProps = {
  visible: boolean;
  titulo: string;
  itens: ItemAPI[];
  carregando?: boolean;
  onClose: () => void;
  onSelect: (item: ItemAPI) => void;
};

async function buscarAPI<T>(url: string): Promise<T> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 12000);

  try {
    const resposta = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    }

    return await resposta.json();
  } finally {
    clearTimeout(timeout);
  }
}

function apenasNumero(texto: string) {
  return texto.replace(/[^0-9]/g, "");
}

function SeletorModal({
  visible,
  titulo,
  itens,
  carregando = false,
  onClose,
  onSelect,
}: SeletorProps) {
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (visible) {
      setBusca("");
    }
  }, [visible]);

  const filtrados = itens.filter((item) =>
    item.name.toLowerCase().includes(busca.toLowerCase().trim())
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalFundo}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>{titulo}</Text>

            <TouchableOpacity
              onPress={onClose}
              style={styles.fechar}
              activeOpacity={0.7}
            >
              <Text style={styles.fecharTexto}>×</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.busca}
            placeholder="Pesquisar..."
            placeholderTextColor="#666"
            value={busca}
            onChangeText={setBusca}
            autoCorrect={false}
          />

          {carregando ? (
            <View style={styles.modalCarregando}>
              <ActivityIndicator color="#ef3340" />

              <Text style={styles.textoSecundario}>
                Carregando...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.lista}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {filtrados.map((item) => (
                <TouchableOpacity
                  key={String(item.code)}
                  style={styles.itemLista}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={styles.itemTexto}>
                    {item.name}
                  </Text>

                  <Text style={styles.setaLista}>›</Text>
                </TouchableOpacity>
              ))}

              {filtrados.length === 0 && (
                <Text style={styles.semResultado}>
                  Nenhum resultado encontrado.
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function App() {
  const scrollRef = useRef<ScrollView>(null);

  const [marcas, setMarcas] = useState<ItemAPI[]>([]);
  const [modelos, setModelos] = useState<ItemAPI[]>([]);
  const [anos, setAnos] = useState<ItemAPI[]>([]);

  const [marca, setMarca] = useState<ItemAPI | null>(null);
  const [modelo, setModelo] = useState<ItemAPI | null>(null);
  const [ano, setAno] = useState<ItemAPI | null>(null);

  const [dadosFipe, setDadosFipe] =
    useState<DadosFipe | null>(null);

  const [modalMarca, setModalMarca] = useState(false);
  const [modalModelo, setModalModelo] = useState(false);
  const [modalAno, setModalAno] = useState(false);

  const [carregandoMarcas, setCarregandoMarcas] =
    useState(false);

  const [carregandoModelos, setCarregandoModelos] =
    useState(false);

  const [carregandoAnos, setCarregandoAnos] =
    useState(false);

  const [carregandoFipe, setCarregandoFipe] =
    useState(false);

  const [analisando, setAnalisando] = useState(false);

  const [km, setKm] = useState("");
  const [peso, setPeso] = useState("");
  const [pneu, setPneu] = useState("");
  const [calibragem, setCalibragem] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [resultado, setResultado] =
    useState<Resultado | null>(null);

  const entrada = useRef(new Animated.Value(0)).current;
  const resultadoAnim = useRef(new Animated.Value(0)).current;
  const barraNota = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    carregarMarcas();
  
    Animated.timing(entrada, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  async function carregarMarcas() {
    try {
      setMensagem("");
      setCarregandoMarcas(true);

      const dados = await buscarAPI<ItemAPI[]>(
        `${API}/cars/brands`
      );

      if (!Array.isArray(dados) || dados.length === 0) {
        throw new Error("Lista de marcas vazia.");
      }

      setMarcas(dados);
    } catch (erro) {
      console.log("Erro marcas:", erro);

      setMensagem(
        "Não foi possível conectar à FIPE. Verifique sua internet e tente novamente."
      );
    } finally {
      setCarregandoMarcas(false);
    }
  }

  async function selecionarMarca(item: ItemAPI) {
    setMarca(item);

    setModelo(null);
    setAno(null);
    setDadosFipe(null);

    setResultado(null);
    setMensagem("");

    setModelos([]);
    setAnos([]);

    try {
      setCarregandoModelos(true);

      const dados = await buscarAPI<ItemAPI[]>(
        `${API}/cars/brands/${item.code}/models`
      );

      if (!Array.isArray(dados) || dados.length === 0) {
        throw new Error("Nenhum modelo encontrado.");
      }

      setModelos(dados);
    } catch (erro) {
      console.log("Erro modelos:", erro);

      setMensagem(
        "Não foi possível carregar os modelos dessa marca."
      );
    } finally {
      setCarregandoModelos(false);
    }
  }

  async function selecionarModelo(item: ItemAPI) {
    if (!marca) {
      setMensagem("Selecione uma marca primeiro.");
      return;
    }

    setModelo(item);

    setAno(null);
    setDadosFipe(null);
    setResultado(null);

    setMensagem("");
    setAnos([]);

    try {
      setCarregandoAnos(true);

      const dados = await buscarAPI<ItemAPI[]>(
        `${API}/cars/brands/${marca.code}/models/${item.code}/years`
      );

      if (!Array.isArray(dados) || dados.length === 0) {
        throw new Error("Nenhum ano encontrado.");
      }

      setAnos(dados);
    } catch (erro) {
      console.log("Erro anos:", erro);

      setMensagem(
        "Não foi possível carregar os anos desse modelo."
      );
    } finally {
      setCarregandoAnos(false);
    }
  }

  async function selecionarAno(item: ItemAPI) {
    if (!marca || !modelo) {
      setMensagem(
        "Selecione a marca e o modelo antes do ano."
      );

      return;
    }

    setAno(item);
    setDadosFipe(null);
    setResultado(null);
    setMensagem("");

    try {
      setCarregandoFipe(true);

      const dados = await buscarAPI<DadosFipe>(
        `${API}/cars/brands/${marca.code}/models/${modelo.code}/years/${item.code}`
      );

      if (
        !dados ||
        !dados.brand ||
        !dados.model ||
        !dados.price
      ) {
        throw new Error("Dados FIPE inválidos.");
      }

      setDadosFipe(dados);
    } catch (erro) {
      console.log("Erro FIPE:", erro);

      setMensagem(
        "Não foi possível consultar os dados FIPE desse veículo. Tente selecionar o ano novamente."
      );
    } finally {
      setCarregandoFipe(false);
    }
  }

  function validarDados() {
    setMensagem("");

    if (!marca) {
      return "Selecione a marca do veículo.";
    }

    if (!modelo) {
      return "Selecione o modelo do veículo.";
    }

    if (!ano) {
      return "Selecione o ano do veículo.";
    }

    if (carregandoFipe) {
      return "Aguarde a consulta FIPE terminar.";
    }

    if (!dadosFipe) {
      return "Os dados FIPE ainda não foram carregados.";
    }

    if (!km.trim()) {
      return "Digite a quilometragem atual.";
    }

    if (!peso.trim()) {
      return "Digite o peso aproximado do veículo.";
    }

    if (!pneu.trim()) {
      return "Digite o tipo de pneu.";
    }

    if (!calibragem.trim()) {
      return "Digite a calibragem dos pneus.";
    }

    const kmNumero = Number(km);
    const pesoNumero = Number(peso);
    const calibragemNumero = Number(calibragem);

    if (!Number.isFinite(kmNumero) || kmNumero < 0) {
      return "Digite uma quilometragem válida.";
    }

    if (kmNumero > 2000000) {
      return "A quilometragem informada parece muito alta.";
    }

    if (
      !Number.isFinite(pesoNumero) ||
      pesoNumero < 500 ||
      pesoNumero > 5000
    ) {
      return "Informe um peso entre 500 e 5000 kg.";
    }

    if (
      !Number.isFinite(calibragemNumero) ||
      calibragemNumero < 10 ||
      calibragemNumero > 60
    ) {
      return "Informe uma calibragem entre 10 e 60 PSI.";
    }

    return null;
  }

  function analisar() {
    const erro = validarDados();

    if (erro) {
      setMensagem(erro);
      return;
    }

    if (!dadosFipe) return;

    setAnalisando(true);
    setMensagem("");

    const kmNumero = Number(km);
    const pesoNumero = Number(peso);
    const calibragemNumero = Number(calibragem);

    let consumo = 12;
    let saude = 100;
    let nota = 100;

    let desempenho = "Bom";
    let categoria = "Uso urbano";

    const alertas: string[] = [];

    const combustivel =
      dadosFipe.fuel?.toLowerCase() || "";

    /*
      Consumo base didático.
      Não representa medição real do veículo.
    */

    if (
      combustivel.includes("etanol") ||
      combustivel.includes("alcool") ||
      combustivel.includes("álcool")
    ) {
      consumo = 8;
    } else if (combustivel.includes("diesel")) {
      consumo = 14;
    } else if (
      combustivel.includes("hibrido") ||
      combustivel.includes("híbrido")
    ) {
      consumo = 17;
    } else if (combustivel.includes("flex")) {
      consumo = 11;
    } else if (combustivel.includes("gasolina")) {
      consumo = 12;
    }

    /*
      Peso
    */

    if (pesoNumero > 2200) {
      consumo -= 3;
      nota -= 10;

      desempenho = "Moderado";
      categoria = "Veículo pesado";
    } else if (pesoNumero > 1600) {
      consumo -= 2;
      nota -= 5;

      categoria = "SUV / Utilitário";
    } else if (pesoNumero < 1100) {
      consumo += 1;

      desempenho = "Muito bom";
      categoria = "Compacto";
    }

    /*
      Quilometragem
    */

    if (kmNumero >= 200000) {
      saude -= 35;
      nota -= 20;

      alertas.push(
        "Quilometragem elevada: mantenha as revisões em dia."
      );
    } else if (kmNumero >= 100000) {
      saude -= 20;
      nota -= 10;

      alertas.push(
        "Quilometragem acima de 100 mil km."
      );
    } else if (kmNumero >= 50000) {
      saude -= 8;
      nota -= 4;
    }

    /*
      Idade
    */

    const anoModelo = Number(dadosFipe.modelYear);

    if (Number.isFinite(anoModelo)) {
      const idade = Math.max(2026 - anoModelo, 0);

      if (idade >= 20) {
        saude -= 20;
        nota -= 12;

        alertas.push(
          "Veículo mais antigo: manutenção preventiva é importante."
        );
      } else if (idade >= 10) {
        saude -= 10;
        nota -= 5;
      }
    }

    /*
      Calibragem
    */

    if (calibragemNumero < 28) {
      consumo -= 1.5;
      nota -= 10;

      alertas.push(
        "Calibragem baixa para a faixa usada pelo simulador."
      );
    } else if (calibragemNumero > 40) {
      nota -= 6;

      alertas.push(
        "Calibragem alta para a faixa usada pelo simulador."
      );
    }

    /*
      Tipo de pneu
    */

    const pneuTexto = pneu.trim().toLowerCase();

    if (
      pneuTexto.includes("esportivo") ||
      pneuTexto.includes("performance")
    ) {
      desempenho = "Muito bom";
      consumo -= 0.5;
    }

    if (
      pneuTexto.includes("off road") ||
      pneuTexto.includes("off-road") ||
      pneuTexto.includes("offroad")
    ) {
      categoria = "Off-road";
      consumo -= 1;
    }

    /*
      Limites
    */

    consumo = Math.max(3, Math.min(consumo, 25));

    saude = Math.round(
      Math.max(30, Math.min(saude, 100))
    );

    nota = Math.round(
      Math.max(0, Math.min(nota, 100))
    );

    let classificacao = "Requer atenção";

    if (nota >= 90) {
      classificacao = "Excelente";
    } else if (nota >= 75) {
      classificacao = "Bom";
    } else if (nota >= 60) {
      classificacao = "Regular";
    }

    const novoResultado: Resultado = {
      desempenho,
      saude,
      consumo: Number(consumo.toFixed(1)),
      categoria,
      nota,
      classificacao,
      alertas,
    };

    setResultado(novoResultado);

    resultadoAnim.setValue(0);
    barraNota.setValue(0);

    Animated.parallel([
      Animated.spring(resultadoAnim, {
        toValue: 1,
        friction: 8,
        tension: 45,
        useNativeDriver: true,
      }),

      Animated.timing(barraNota, {
        toValue: nota,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setAnalisando(false);

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);
    });
  }

  function limpar() {
    setMarca(null);
    setModelo(null);
    setAno(null);

    setModelos([]);
    setAnos([]);

    setDadosFipe(null);
    setResultado(null);

    setKm("");
    setPeso("");
    setPneu("");
    setCalibragem("");

    setMensagem("");

    barraNota.setValue(0);
    resultadoAnim.setValue(0);

    scrollRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
  }

  const formularioCompleto =
    !!marca &&
    !!modelo &&
    !!ano &&
    !!dadosFipe &&
    !!km.trim() &&
    !!peso.trim() &&
    !!pneu.trim() &&
    !!calibragem.trim() &&
    !carregandoFipe &&
    !analisando;

  const larguraBarra = barraNota.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const entradaY = entrada.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const resultadoY = resultadoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [25, 0],
  });

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: entrada,
            transform: [{ translateY: entradaY }],
          }}
        >
          <View style={styles.topo}>
            <Text style={styles.logo}>
              Torque
              <Text style={styles.logoVermelho}>
                Lab
              </Text>
            </Text>

            <View style={styles.status}>
              <View
                style={[
                  styles.statusBolinha,
                  mensagem &&
                    marcas.length === 0 &&
                    styles.statusOffline,
                ]}
              />

              <Text style={styles.statusTexto}>
                {marcas.length > 0
                  ? "FIPE online"
                  : carregandoMarcas
                  ? "Conectando..."
                  : "FIPE"}
              </Text>
            </View>
          </View>

          <Text style={styles.titulo}>
            Análise veicular
            {"\n"}
            simples.
          </Text>

          <Text style={styles.subtitulo}>
            Escolha seu veículo e informe os dados
            atuais para gerar uma análise estimada.
          </Text>

          {mensagem !== "" && (
            <View style={styles.mensagemErro}>
              <View style={styles.erroConteudo}>
                <Text style={styles.erroTitulo}>
                  Atenção
                </Text>

                <Text style={styles.erroTexto}>
                  {mensagem}
                </Text>
              </View>

              {marcas.length === 0 &&
                !carregandoMarcas && (
                  <TouchableOpacity
                    style={styles.tentarNovamente}
                    onPress={carregarMarcas}
                  >
                    <Text
                      style={
                        styles.tentarNovamenteTexto
                      }
                    >
                      Tentar novamente
                    </Text>
                  </TouchableOpacity>
                )}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.tituloSecao}>
              Veículo
            </Text>

            <Text style={styles.label}>
              Marca
            </Text>

            <TouchableOpacity
              style={styles.seletor}
              activeOpacity={0.75}
              disabled={
                carregandoMarcas ||
                marcas.length === 0
              }
              onPress={() =>
                setModalMarca(true)
              }
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.seletorTexto,
                  !marca && styles.placeholder,
                ]}
              >
                {carregandoMarcas
                  ? "Carregando marcas..."
                  : marca?.name ||
                    "Selecionar marca"}
              </Text>

              {carregandoMarcas ? (
                <ActivityIndicator
                  size="small"
                  color="#ef3340"
                />
              ) : (
                <Text style={styles.chevron}>
                  ›
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>
              Modelo
            </Text>

            <TouchableOpacity
              style={[
                styles.seletor,
                !marca && styles.desativado,
              ]}
              activeOpacity={0.75}
              disabled={
                !marca ||
                carregandoModelos ||
                modelos.length === 0
              }
              onPress={() =>
                setModalModelo(true)
              }
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.seletorTexto,
                  !modelo && styles.placeholder,
                ]}
              >
                {carregandoModelos
                  ? "Carregando modelos..."
                  : modelo?.name ||
                    "Selecionar modelo"}
              </Text>

              {carregandoModelos ? (
                <ActivityIndicator
                  size="small"
                  color="#ef3340"
                />
              ) : (
                <Text style={styles.chevron}>
                  ›
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>
              Ano / combustível
            </Text>

            <TouchableOpacity
              style={[
                styles.seletor,
                !modelo && styles.desativado,
              ]}
              activeOpacity={0.75}
              disabled={
                !modelo ||
                carregandoAnos ||
                anos.length === 0
              }
              onPress={() =>
                setModalAno(true)
              }
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.seletorTexto,
                  !ano && styles.placeholder,
                ]}
              >
                {carregandoAnos
                  ? "Carregando anos..."
                  : ano?.name ||
                    "Selecionar ano"}
              </Text>

              {carregandoAnos ? (
                <ActivityIndicator
                  size="small"
                  color="#ef3340"
                />
              ) : (
                <Text style={styles.chevron}>
                  ›
                </Text>
              )}
            </TouchableOpacity>

            {carregandoFipe && (
              <View style={styles.carregando}>
                <ActivityIndicator
                  color="#ef3340"
                  size="small"
                />

                <Text
                  style={
                    styles.carregandoTexto
                  }
                >
                  Consultando FIPE...
                </Text>
              </View>
            )}

            {dadosFipe && (
              <View style={styles.fipe}>
                <Text style={styles.fipeLabel}>
                  VALOR DE REFERÊNCIA
                </Text>

                <Text style={styles.fipePreco}>
                  {dadosFipe.price}
                </Text>

                <Text style={styles.fipeNome}>
                  {dadosFipe.brand}{" "}
                  {dadosFipe.model}
                </Text>

                <View style={styles.fipeLinha}>
                  <Text
                    style={styles.fipeDetalhe}
                  >
                    {dadosFipe.modelYear}
                  </Text>

                  <Text style={styles.ponto}>
                    •
                  </Text>

                  <Text
                    style={styles.fipeDetalhe}
                  >
                    {dadosFipe.fuel}
                  </Text>
                </View>

                <Text
                  style={styles.codigoFipe}
                >
                  Código FIPE:{" "}
                  {dadosFipe.codeFipe}
                </Text>

                {dadosFipe.referenceMonth && (
                  <Text
                    style={
                      styles.referenciaFipe
                    }
                  >
                    Referência:{" "}
                    {dadosFipe.referenceMonth}
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.tituloSecao}>
              Dados atuais
            </Text>

            <View style={styles.linha}>
              <View
                style={[
                  styles.campoMetade,
                  styles.campoEsquerda,
                ]}
              >
                <Text style={styles.label}>
                  Quilometragem
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Ex: 65000"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={km}
                  maxLength={7}
                  onChangeText={(texto) =>
                    setKm(
                      apenasNumero(texto)
                    )
                  }
                />
              </View>

              <View
                style={styles.campoMetade}
              >
                <Text style={styles.label}>
                  Peso (kg)
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Ex: 1350"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={peso}
                  maxLength={4}
                  onChangeText={(texto) =>
                    setPeso(
                      apenasNumero(texto)
                    )
                  }
                />
              </View>
            </View>

            <View style={styles.linha}>
              <View
                style={[
                  styles.campoMetade,
                  styles.campoEsquerda,
                ]}
              >
                <Text style={styles.label}>
                  Tipo de pneu
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Ex: Convencional"
                  placeholderTextColor="#666"
                  value={pneu}
                  maxLength={30}
                  onChangeText={setPneu}
                  autoCorrect={false}
                />
              </View>

              <View
                style={styles.campoMetade}
              >
                <Text style={styles.label}>
                  Calibragem (PSI)
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Ex: 32"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={calibragem}
                  maxLength={2}
                  onChangeText={(texto) =>
                    setCalibragem(
                      apenasNumero(texto)
                    )
                  }
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.botao,
              !formularioCompleto &&
                styles.botaoIncompleto,
            ]}
            activeOpacity={0.82}
            onPress={analisar}
            disabled={analisando}
          >
            {analisando ? (
              <>
                <ActivityIndicator
                  color="#fff"
                  size="small"
                />

                <Text
                  style={[
                    styles.botaoTexto,
                    styles.botaoTextoCarregando,
                  ]}
                >
                  Analisando...
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.botaoTexto}>
                  Analisar veículo
                </Text>

                <Text style={styles.botaoSeta}>
                  →
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {resultado && dadosFipe && (
          <Animated.View
            style={[
              styles.resultado,
              {
                opacity: resultadoAnim,
                transform: [
                  {
                    translateY: resultadoY,
                  },
                ],
              },
            ]}
          >
            <Text
              style={styles.resultadoPequeno}
            >
              RESULTADO DA ANÁLISE
            </Text>

            <Text
              style={styles.resultadoTitulo}
            >
              {dadosFipe.brand}
            </Text>

            <Text style={styles.nomeCarro}>
              {dadosFipe.model}
            </Text>

            <Text style={styles.infoCarro}>
              {dadosFipe.modelYear} •{" "}
              {dadosFipe.fuel}
            </Text>

            <View style={styles.valorFipe}>
              <Text
                style={styles.valorFipeLabel}
              >
                VALOR FIPE
              </Text>

              <Text
                style={styles.valorFipeNumero}
              >
                {dadosFipe.price}
              </Text>
            </View>

            <View style={styles.notaArea}>
              <View style={styles.notaTopo}>
                <View>
                  <Text
                    style={styles.notaLabel}
                  >
                    NOTA GERAL
                  </Text>

                  <Text style={styles.nota}>
                    {resultado.nota}
                    <Text style={styles.notaDe}>
                      /100
                    </Text>
                  </Text>
                </View>

                <View
                  style={
                    styles.classificacaoBox
                  }
                >
                  <Text
                    style={
                      styles.classificacao
                    }
                  >
                    {
                      resultado.classificacao
                    }
                  </Text>
                </View>
              </View>

              <View
                style={styles.barraFundo}
              >
                <Animated.View
                  style={[
                    styles.barra,
                    {
                      width: larguraBarra,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.metricas}>
              <View
                style={[
                  styles.metrica,
                  styles.metricaEsquerda,
                ]}
              >
                <Text
                  style={styles.metricaLabel}
                >
                  Consumo estimado
                </Text>

                <Text
                  style={styles.metricaValor}
                >
                  {resultado.consumo} km/L
                </Text>
              </View>

              <View style={styles.metrica}>
                <Text
                  style={styles.metricaLabel}
                >
                  Saúde estimada
                </Text>

                <Text
                  style={styles.metricaValor}
                >
                  {resultado.saude}%
                </Text>
              </View>

              <View
                style={[
                  styles.metrica,
                  styles.metricaEsquerda,
                  styles.metricaBaixo,
                ]}
              >
                <Text
                  style={styles.metricaLabel}
                >
                  Desempenho
                </Text>

                <Text
                  style={styles.metricaValor}
                >
                  {resultado.desempenho}
                </Text>
              </View>

              <View
                style={[
                  styles.metrica,
                  styles.metricaBaixo,
                ]}
              >
                <Text
                  style={styles.metricaLabel}
                >
                  Categoria
                </Text>

                <Text
                  style={styles.metricaValor}
                >
                  {resultado.categoria}
                </Text>
              </View>
            </View>

            {resultado.alertas.length >
              0 && (
              <View style={styles.alertas}>
                <Text
                  style={styles.alertasTitulo}
                >
                  Pontos de atenção
                </Text>

                {resultado.alertas.map(
                  (alerta, index) => (
                    <View
                      style={
                        styles.alertaLinha
                      }
                      key={`${alerta}-${index}`}
                    >
                      <View
                        style={
                          styles.alertaBolinha
                        }
                      />

                      <Text
                        style={
                          styles.alertaTexto
                        }
                      >
                        {alerta}
                      </Text>
                    </View>
                  )
                )}
              </View>
            )}

            <View
              style={styles.sustentabilidade}
            >
              <Text
                style={
                  styles.sustentabilidadeTitulo
                }
              >
                Uso consciente
              </Text>

              <Text
                style={
                  styles.sustentabilidadeTexto
                }
              >
                Manter pneus calibrados e
                realizar revisões periódicas
                pode ajudar a evitar consumo
                desnecessário de combustível.
              </Text>
            </View>

            <Text style={styles.aviso}>
              O valor FIPE é consultado na
              base externa. Consumo, saúde,
              desempenho e nota são estimativas
              educacionais do TorqueLab e não
              substituem uma avaliação mecânica.
            </Text>

            <TouchableOpacity
              style={styles.botaoSecundario}
              activeOpacity={0.8}
              onPress={limpar}
            >
              <Text
                style={
                  styles.botaoSecundarioTexto
                }
              >
                Fazer nova análise
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerLogo}>
            Torque
            <Text
              style={styles.logoVermelho}
            >
              Lab
            </Text>
          </Text>

          <Text style={styles.footerTexto}>
            Simulador veicular educacional •
            2026
          </Text>
        </View>
      </ScrollView>

      <SeletorModal
        visible={modalMarca}
        titulo="Selecionar marca"
        itens={marcas}
        carregando={carregandoMarcas}
        onClose={() =>
          setModalMarca(false)
        }
        onSelect={selecionarMarca}
      />

      <SeletorModal
        visible={modalModelo}
        titulo="Selecionar modelo"
        itens={modelos}
        carregando={carregandoModelos}
        onClose={() =>
          setModalModelo(false)
        }
        onSelect={selecionarModelo}
      />

      <SeletorModal
        visible={modalAno}
        titulo="Selecionar ano"
        itens={anos}
        carregando={carregandoAnos}
        onClose={() =>
          setModalAno(false)
        }
        onSelect={selecionarAno}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090909",
  },

  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 42,
    paddingBottom: 40,
  },

  topo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 45,
  },

  logo: {
    color: "#fff",
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: -0.8,
  },

  logoVermelho: {
    color: "#ef3340",
  },

  status: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusBolinha: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: "#43c977",
    marginRight: 7,
  },

  statusOffline: {
    backgroundColor: "#ef3340",
  },

  statusTexto: {
    color: "#777",
    fontSize: 12,
  },

  titulo: {
    color: "#fff",
    fontSize: 39,
    lineHeight: 44,
    fontWeight: "800",
    letterSpacing: -1.6,
  },

  subtitulo: {
    color: "#777",
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 500,
    marginTop: 14,
    marginBottom: 32,
  },

  mensagemErro: {
    backgroundColor: "#1c1213",
    borderRadius: 14,
    padding: 15,
    marginBottom: 15,
  },

  erroConteudo: {
    marginBottom: 4,
  },

  erroTitulo: {
    color: "#ef3340",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },

  erroTexto: {
    color: "#bbb",
    fontSize: 12,
    lineHeight: 19,
  },

  tentarNovamente: {
    alignSelf: "flex-start",
    backgroundColor: "#2a181a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },

  tentarNovamenteTexto: {
    color: "#ef3340",
    fontSize: 11,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
  },

  tituloSecao: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 22,
  },

  label: {
    color: "#777",
    fontSize: 11,
    marginBottom: 7,
  },

  seletor: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: "#191919",
    paddingHorizontal: 15,
    marginBottom: 17,
    flexDirection: "row",
    alignItems: "center",
  },

  seletorTexto: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    paddingRight: 8,
  },

  placeholder: {
    color: "#666",
  },

  desativado: {
    opacity: 0.4,
  },

  chevron: {
    color: "#666",
    fontSize: 25,
  },

  carregando: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  carregandoTexto: {
    color: "#777",
    fontSize: 12,
    marginLeft: 9,
  },

  fipe: {
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingTop: 18,
    marginTop: 5,
  },

  fipeLabel: {
    color: "#666",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.8,
  },

  fipePreco: {
    color: "#fff",
    fontSize: 27,
    fontWeight: "800",
    marginTop: 5,
  },

  fipeNome: {
    color: "#bbb",
    fontSize: 13,
    marginTop: 12,
  },

  fipeLinha: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  fipeDetalhe: {
    color: "#777",
    fontSize: 12,
  },

  ponto: {
    color: "#444",
    marginHorizontal: 8,
  },

  codigoFipe: {
    color: "#555",
    fontSize: 10,
    marginTop: 10,
  },

  referenciaFipe: {
    color: "#555",
    fontSize: 10,
    marginTop: 3,
  },

  linha: {
    flexDirection: "row",
    width: "100%",
  },

  campoMetade: {
    flex: 1,
  },

  campoEsquerda: {
    marginRight: 10,
  },

  input: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#191919",
    paddingHorizontal: 14,
    color: "#fff",
    fontSize: 14,
    marginBottom: 17,
  },

  botao: {
    minHeight: 58,
    borderRadius: 14,
    paddingHorizontal: 20,
    backgroundColor: "#ef3340",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
    marginBottom: 35,
  },

  botaoIncompleto: {
    backgroundColor: "#bd2934",
  },

  botaoTexto: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  botaoTextoCarregando: {
    flex: 1,
    marginLeft: 10,
  },

  botaoSeta: {
    color: "#fff",
    fontSize: 23,
  },

  resultado: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 22,
    marginBottom: 30,
  },

  resultadoPequeno: {
    color: "#666",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 15,
  },

  resultadoTitulo: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },

  nomeCarro: {
    color: "#ddd",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 3,
  },

  infoCarro: {
    color: "#777",
    fontSize: 12,
    marginTop: 7,
  },

  valorFipe: {
    marginTop: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#222",
  },

  valorFipeLabel: {
    color: "#666",
    fontSize: 9,
    marginBottom: 5,
  },

  valorFipeNumero: {
    color: "#fff",
    fontSize: 29,
    fontWeight: "800",
  },

  notaArea: {
    marginTop: 24,
  },

  notaTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  notaLabel: {
    color: "#666",
    fontSize: 9,
  },

  nota: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "800",
    marginTop: 2,
  },

  notaDe: {
    color: "#555",
    fontSize: 13,
  },

  classificacaoBox: {
    backgroundColor: "#211315",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },

  classificacao: {
    color: "#ef3340",
    fontSize: 12,
    fontWeight: "700",
  },

  barraFundo: {
    height: 5,
    backgroundColor: "#252525",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 10,
  },

  barra: {
    height: "100%",
    backgroundColor: "#ef3340",
  },

  metricas: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 22,
  },

  metrica: {
    width: "48.5%",
    backgroundColor: "#181818",
    borderRadius: 12,
    padding: 15,
  },

  metricaEsquerda: {
    marginRight: "3%",
  },

  metricaBaixo: {
    marginTop: 10,
  },

  metricaLabel: {
    color: "#666",
    fontSize: 10,
    marginBottom: 7,
  },

  metricaValor: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  alertas: {
    marginTop: 18,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#1c1213",
  },

  alertasTitulo: {
    color: "#ef3340",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },

  alertaLinha: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 5,
  },

  alertaBolinha: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#ef3340",
    marginTop: 7,
    marginRight: 8,
  },

  alertaTexto: {
    flex: 1,
    color: "#aaa",
    fontSize: 12,
    lineHeight: 19,
  },

  sustentabilidade: {
    backgroundColor: "#121a15",
    borderRadius: 12,
    padding: 15,
    marginTop: 18,
  },

  sustentabilidadeTitulo: {
    color: "#6fd090",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },

  sustentabilidadeTexto: {
    color: "#8a9b90",
    fontSize: 11,
    lineHeight: 18,
  },

  aviso: {
    color: "#555",
    textAlign: "center",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 20,
  },

  botaoSecundario: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#1b1b1b",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  botaoSecundarioTexto: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  footer: {
    alignItems: "center",
    paddingVertical: 10,
  },

  footerLogo: {
    color: "#666",
    fontSize: 13,
    fontWeight: "700",
  },

  footerTexto: {
    color: "#444",
    fontSize: 9,
    marginTop: 5,
  },

  modalFundo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },

  modalCard: {
    width: "100%",
    maxWidth: 600,
    maxHeight: "80%",
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 18,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  modalTitulo: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  fechar: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  fecharTexto: {
    color: "#777",
    fontSize: 27,
  },

  busca: {
    height: 50,
    backgroundColor: "#191919",
    borderRadius: 11,
    paddingHorizontal: 14,
    color: "#fff",
    marginBottom: 10,
  },

  lista: {
    flexGrow: 0,
  },

  itemLista: {
    minHeight: 53,
    borderBottomWidth: 1,
    borderBottomColor: "#1f1f1f",
    flexDirection: "row",
    alignItems: "center",
  },

  itemTexto: {
    color: "#ddd",
    flex: 1,
    fontSize: 14,
    paddingRight: 10,
  },

  setaLista: {
    color: "#555",
    fontSize: 22,
  },

  semResultado: {
    color: "#666",
    textAlign: "center",
    paddingVertical: 30,
  },

  modalCarregando: {
    paddingVertical: 35,
    alignItems: "center",
  },

  textoSecundario: {
    color: "#777",
    fontSize: 12,
    marginTop: 10,
  },
});