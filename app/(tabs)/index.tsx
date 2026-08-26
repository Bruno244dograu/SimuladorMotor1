import React, { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
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
  code: string;
  name: string;
};

type DadosFipe = {
  vehicleType: number;
  price: string;
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
  codeFipe: string;
  referenceMonth: string;
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
  onClose: () => void;
  onSelect: (item: ItemAPI) => void;
};

function SeletorModal({
  visible,
  titulo,
  itens,
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
    item.name.toLowerCase().includes(busca.toLowerCase())
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
            <View>
              <Text style={styles.modalPequeno}>
                TORQUELAB DATABASE
              </Text>

              <Text style={styles.modalTitulo}>
                {titulo}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.fecharModal}
              onPress={onClose}
            >
              <Text style={styles.fecharModalTexto}>
                ×
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.buscaInput}
            placeholder="Pesquisar..."
            placeholderTextColor="#69707c"
            value={busca}
            onChangeText={setBusca}
          />

          <ScrollView
            style={styles.listaModal}
            showsVerticalScrollIndicator={false}
          >
            {filtrados.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={styles.itemModal}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.itemModalTexto}>
                  {item.name}
                </Text>

                <Text style={styles.itemModalSeta}>
                  ›
                </Text>
              </TouchableOpacity>
            ))}

            {filtrados.length === 0 && (
              <Text style={styles.semResultado}>
                Nenhum resultado encontrado.
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function App() {
  const [marcas, setMarcas] = useState<ItemAPI[]>([]);
  const [modelos, setModelos] = useState<ItemAPI[]>([]);
  const [anos, setAnos] = useState<ItemAPI[]>([]);

  const [marcaSelecionada, setMarcaSelecionada] =
    useState<ItemAPI | null>(null);

  const [modeloSelecionado, setModeloSelecionado] =
    useState<ItemAPI | null>(null);

  const [anoSelecionado, setAnoSelecionado] =
    useState<ItemAPI | null>(null);

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

  const [pneu, setPneu] = useState("");
  const [calibragem, setCalibragem] = useState("");
  const [peso, setPeso] = useState("");
  const [km, setKm] = useState("");

  const [resultado, setResultado] =
    useState<Resultado | null>(null);

  const entrada = useRef(new Animated.Value(0)).current;
  const relatorioAnim = useRef(new Animated.Value(0)).current;
  const barraNota = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    carregarMarcas();

    Animated.timing(entrada, {
      toValue: 1,
      duration: 850,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  async function carregarMarcas() {
    try {
      setCarregandoMarcas(true);

      const resposta = await fetch(`${API}/cars/brands`);

      if (!resposta.ok) {
        throw new Error("Erro ao buscar marcas.");
      }

      const dados: ItemAPI[] = await resposta.json();

      setMarcas(dados);
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        "Erro de conexão",
        "Não foi possível carregar as marcas da FIPE."
      );
    } finally {
      setCarregandoMarcas(false);
    }
  }

  async function selecionarMarca(item: ItemAPI) {
    setMarcaSelecionada(item);

    setModeloSelecionado(null);
    setAnoSelecionado(null);

    setModelos([]);
    setAnos([]);

    setDadosFipe(null);
    setResultado(null);

    try {
      setCarregandoModelos(true);

      const resposta = await fetch(
        `${API}/cars/brands/${item.code}/models`
      );

      if (!resposta.ok) {
        throw new Error("Erro ao carregar modelos.");
      }

      const dados: ItemAPI[] = await resposta.json();

      setModelos(dados);
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        "Erro",
        "Não foi possível carregar os modelos desta marca."
      );
    } finally {
      setCarregandoModelos(false);
    }
  }

  async function selecionarModelo(item: ItemAPI) {
    if (!marcaSelecionada) return;

    setModeloSelecionado(item);

    setAnoSelecionado(null);
    setAnos([]);
    setDadosFipe(null);
    setResultado(null);

    try {
      setCarregandoAnos(true);

      const resposta = await fetch(
        `${API}/cars/brands/${marcaSelecionada.code}/models/${item.code}/years`
      );

      if (!resposta.ok) {
        throw new Error("Erro ao buscar anos.");
      }

      const dados: ItemAPI[] = await resposta.json();

      setAnos(dados);
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        "Erro",
        "Não foi possível carregar os anos deste veículo."
      );
    } finally {
      setCarregandoAnos(false);
    }
  }

  async function selecionarAno(item: ItemAPI) {
    if (!marcaSelecionada || !modeloSelecionado) return;

    setAnoSelecionado(item);
    setDadosFipe(null);
    setResultado(null);

    try {
      setCarregandoFipe(true);

      const resposta = await fetch(
        `${API}/cars/brands/${marcaSelecionada.code}/models/${modeloSelecionado.code}/years/${item.code}`
      );

      if (!resposta.ok) {
        throw new Error("Erro ao consultar FIPE.");
      }

      const dados: DadosFipe = await resposta.json();

      setDadosFipe(dados);
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        "Erro na consulta",
        "Não foi possível obter os dados FIPE deste veículo."
      );
    } finally {
      setCarregandoFipe(false);
    }
  }

  function analisar() {
    console.log("BOTÃO ANALISAR CLICADO");

    if (!marcaSelecionada) {
      Alert.alert(
        "Atenção",
        "Selecione a marca do veículo."
      );
      return;
    }

    if (!modeloSelecionado) {
      Alert.alert(
        "Atenção",
        "Selecione o modelo do veículo."
      );
      return;
    }

    if (!anoSelecionado) {
      Alert.alert(
        "Atenção",
        "Selecione o ano do veículo."
      );
      return;
    }

    if (!dadosFipe) {
      Alert.alert(
        "Aguarde",
        "Os dados da FIPE ainda não foram carregados. Selecione novamente o ano."
      );
      return;
    }

    if (!km.trim()) {
      Alert.alert(
        "Atenção",
        "Digite a quilometragem."
      );
      return;
    }

    if (!peso.trim()) {
      Alert.alert(
        "Atenção",
        "Digite o peso do veículo."
      );
      return;
    }

    if (!pneu.trim()) {
      Alert.alert(
        "Atenção",
        "Digite o tipo de pneu."
      );
      return;
    }

    if (!calibragem.trim()) {
      Alert.alert(
        "Atenção",
        "Digite a calibragem."
      );
      return;
    }

    const pesoNumero = Number(peso);
    const kmNumero = Number(km);
    const calibragemNumero = Number(calibragem);

    if (isNaN(pesoNumero) || pesoNumero <= 0) {
      Alert.alert(
        "Erro",
        "Digite um peso válido."
      );
      return;
    }

    if (isNaN(kmNumero) || kmNumero < 0) {
      Alert.alert(
        "Erro",
        "Digite uma quilometragem válida."
      );
      return;
    }

    if (
      isNaN(calibragemNumero) ||
      calibragemNumero < 10 ||
      calibragemNumero > 60
    ) {
      Alert.alert(
        "Erro",
        "Digite uma calibragem entre 10 e 60 PSI."
      );
      return;
    }

    let consumo = 12;
    let saude = 100;
    let nota = 100;

    let desempenho = "Bom";
    let categoria = "Uso urbano";

    const alertas: string[] = [];

    const combustivel =
      dadosFipe.fuel?.toLowerCase() || "";

    if (
      combustivel.includes("etanol") ||
      combustivel.includes("álcool") ||
      combustivel.includes("alcool")
    ) {
      consumo = 8;
    } else if (
      combustivel.includes("diesel")
    ) {
      consumo = 14;
    } else if (
      combustivel.includes("híbrido") ||
      combustivel.includes("hibrido")
    ) {
      consumo = 17;
    } else if (
      combustivel.includes("flex")
    ) {
      consumo = 11;
    } else if (
      combustivel.includes("gasolina")
    ) {
      consumo = 12;
    }

    if (pesoNumero > 2000) {
      consumo -= 3;
      desempenho = "Moderado";
      categoria = "Veículo pesado";
      nota -= 10;
    } else if (pesoNumero > 1500) {
      consumo -= 2;
      categoria = "SUV / Utilitário";
      nota -= 5;
    } else if (pesoNumero < 1100) {
      consumo += 1;
      desempenho = "Muito bom";
      categoria = "Compacto";
    }

    if (kmNumero > 200000) {
      saude -= 35;
      nota -= 20;

      alertas.push(
        "Quilometragem muito elevada."
      );
    } else if (kmNumero > 100000) {
      saude -= 20;
      nota -= 10;

      alertas.push(
        "Veículo com quilometragem elevada."
      );
    } else if (kmNumero > 50000) {
      saude -= 10;
      nota -= 5;
    }

    const idade =
      2026 - Number(dadosFipe.modelYear);

    if (idade > 20) {
      saude -= 20;
      nota -= 15;

      alertas.push(
        "Veículo com mais de 20 anos."
      );
    } else if (idade > 10) {
      saude -= 10;
      nota -= 5;
    }

    if (calibragemNumero < 28) {
      consumo -= 1.5;
      nota -= 10;

      alertas.push(
        "Calibragem abaixo da faixa utilizada pelo simulador."
      );
    } else if (calibragemNumero > 40) {
      nota -= 5;

      alertas.push(
        "Calibragem acima da faixa utilizada pelo simulador."
      );
    }

    const pneuTexto = pneu.toLowerCase();

    if (
      pneuTexto.includes("esportivo") ||
      pneuTexto.includes("performance")
    ) {
      desempenho = "Muito bom";
      consumo -= 0.5;
    }

    if (
      pneuTexto.includes("off road") ||
      pneuTexto.includes("off-road")
    ) {
      categoria = "SUV / Off-road";
      consumo -= 1;
    }

    consumo = Math.max(consumo, 3);
    saude = Math.max(
      Math.min(saude, 100),
      30
    );

    nota = Math.max(
      Math.min(nota, 100),
      0
    );

    let classificacao =
      "Requer atenção";

    if (nota >= 90) {
      classificacao = "Excelente";
    } else if (nota >= 75) {
      classificacao = "Muito bom";
    } else if (nota >= 60) {
      classificacao = "Regular";
    }

    const novoResultado = {
      desempenho,
      saude,
      consumo: Number(
        consumo.toFixed(1)
      ),
      categoria,
      nota,
      classificacao,
      alertas,
    };

    console.log(
      "RESULTADO:",
      novoResultado
    );

    setResultado(novoResultado);

    relatorioAnim.setValue(0);
    barraNota.setValue(0);

    Animated.parallel([
      Animated.spring(
        relatorioAnim,
        {
          toValue: 1,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        barraNota,
        {
          toValue: nota,
          duration: 1000,
          easing:
            Easing.out(
              Easing.cubic
            ),
          useNativeDriver: false,
        }
      ),
    ]).start();
  }

  function limpar() {
    setMarcaSelecionada(null);
    setModeloSelecionado(null);
    setAnoSelecionado(null);

    setModelos([]);
    setAnos([]);

    setDadosFipe(null);

    setPneu("");
    setCalibragem("");
    setPeso("");
    setKm("");

    setResultado(null);
  }

  const larguraBarra =
    barraNota.interpolate({
      inputRange: [0, 100],
      outputRange: ["0%", "100%"],
    });

  const entradaTranslate =
    entrada.interpolate({
      inputRange: [0, 1],
      outputRange: [30, 0],
    });

  const relatorioTranslate =
    relatorioAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [40, 0],
    });

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <Animated.View
          style={{
            opacity: entrada,
            transform: [
              {
                translateY:
                  entradaTranslate,
              },
            ],
          }}
        >
          <View style={styles.header}>
            <View
              style={styles.logoBox}
            >
              <Text
                style={styles.logoTexto}
              >
                TL
              </Text>
            </View>

            <View>
              <Text
                style={styles.nomeEmpresa}
              >
                TORQUELAB
              </Text>

              <Text
                style={styles.nomeEmpresa2}
              >
                AUTOMOTIVE
              </Text>
            </View>
          </View>

          <Text
            style={styles.heroTitulo}
          >
            Tecnologia aplicada ao seu
            veículo.
          </Text>

          <Text
            style={styles.heroDescricao}
          >
            Consulte dados reais da
            Tabela FIPE e gere uma
            análise estimada do veículo.
          </Text>

          <View
            style={styles.onlineBadge}
          >
            <View
              style={styles.onlineBolinha}
            />

            <Text
              style={styles.onlineTexto}
            >
              BASE FIPE CONECTADA
            </Text>
          </View>

          <View style={styles.card}>
            <View
              style={
                styles.cardCabecalho
              }
            >
              <View
                style={styles.numeroBox}
              >
                <Text
                  style={
                    styles.numeroTexto
                  }
                >
                  01
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={
                    styles.cardTitulo
                  }
                >
                  Selecione o veículo
                </Text>

                <Text
                  style={
                    styles.cardSubtitulo
                  }
                >
                  Dados fornecidos pela
                  base FIPE
                </Text>
              </View>
            </View>

            <Text style={styles.label}>
              MARCA
            </Text>

            <TouchableOpacity
              style={styles.seletor}
              disabled={
                carregandoMarcas
              }
              onPress={() =>
                setModalMarca(true)
              }
            >
              <Text
                style={[
                  styles.seletorTexto,
                  !marcaSelecionada &&
                    styles.placeholder,
                ]}
              >
                {carregandoMarcas
                  ? "Carregando marcas..."
                  : marcaSelecionada?.name ||
                    "Selecionar marca"}
              </Text>

              {carregandoMarcas ? (
                <ActivityIndicator
                  size="small"
                  color="#e92335"
                />
              ) : (
                <Text
                  style={styles.chevron}
                >
                  ›
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>
              MODELO
            </Text>

            <TouchableOpacity
              style={[
                styles.seletor,
                !marcaSelecionada &&
                  styles.seletorBloqueado,
              ]}
              disabled={
                !marcaSelecionada ||
                carregandoModelos
              }
              onPress={() =>
                setModalModelo(true)
              }
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.seletorTexto,
                  !modeloSelecionado &&
                    styles.placeholder,
                ]}
              >
                {carregandoModelos
                  ? "Carregando modelos..."
                  : modeloSelecionado?.name ||
                    "Selecionar modelo"}
              </Text>

              {carregandoModelos ? (
                <ActivityIndicator
                  size="small"
                  color="#e92335"
                />
              ) : (
                <Text
                  style={styles.chevron}
                >
                  ›
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>
              ANO / COMBUSTÍVEL
            </Text>

            <TouchableOpacity
              style={[
                styles.seletor,
                !modeloSelecionado &&
                  styles.seletorBloqueado,
              ]}
              disabled={
                !modeloSelecionado ||
                carregandoAnos
              }
              onPress={() =>
                setModalAno(true)
              }
            >
              <Text
                style={[
                  styles.seletorTexto,
                  !anoSelecionado &&
                    styles.placeholder,
                ]}
              >
                {carregandoAnos
                  ? "Carregando anos..."
                  : anoSelecionado?.name ||
                    "Selecionar ano"}
              </Text>

              {carregandoAnos ? (
                <ActivityIndicator
                  size="small"
                  color="#e92335"
                />
              ) : (
                <Text
                  style={styles.chevron}
                >
                  ›
                </Text>
              )}
            </TouchableOpacity>

            {carregandoFipe && (
              <View
                style={
                  styles.carregandoFipe
                }
              >
                <ActivityIndicator
                  color="#e92335"
                />

                <Text
                  style={
                    styles.carregandoFipeTexto
                  }
                >
                  Consultando Tabela
                  FIPE...
                </Text>
              </View>
            )}

            {dadosFipe && (
              <View
                style={styles.fipeCard}
              >
                <Text
                  style={styles.fipeMini}
                >
                  VALOR DE REFERÊNCIA
                </Text>

                <Text
                  style={styles.fipePreco}
                >
                  {dadosFipe.price}
                </Text>

                <Text
                  style={styles.fipeModelo}
                >
                  {dadosFipe.brand}{" "}
                  {dadosFipe.model}
                </Text>

                <Text
                  style={styles.fipeValor}
                >
                  Ano:{" "}
                  {dadosFipe.modelYear}
                </Text>

                <Text
                  style={styles.fipeValor}
                >
                  Combustível:{" "}
                  {dadosFipe.fuel}
                </Text>

                <Text
                  style={styles.fipeValor}
                >
                  Código FIPE:{" "}
                  {dadosFipe.codeFipe}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text
              style={styles.cardTitulo}
            >
              Dados atuais
            </Text>

            <Text style={styles.label}>
              QUILOMETRAGEM
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex: 65000"
              placeholderTextColor="#69707c"
              value={km}
              onChangeText={setKm}
              keyboardType="numeric"
            />

            <Text style={styles.label}>
              PESO DO VEÍCULO
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex: 1350"
              placeholderTextColor="#69707c"
              value={peso}
              onChangeText={setPeso}
              keyboardType="numeric"
            />

            <Text style={styles.label}>
              TIPO DE PNEU
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex: Convencional"
              placeholderTextColor="#69707c"
              value={pneu}
              onChangeText={setPneu}
            />

            <Text style={styles.label}>
              CALIBRAGEM
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex: 32"
              placeholderTextColor="#69707c"
              value={calibragem}
              onChangeText={setCalibragem}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={
              styles.botaoAnalisar
            }
            activeOpacity={0.85}
            onPress={analisar}
          >
            <View>
              <Text
                style={styles.botaoMini}
              >
                TORQUELAB ANALYTICS
              </Text>

              <Text
                style={styles.botaoTexto}
              >
                ANALISAR VEÍCULO
              </Text>
            </View>

            <Text
              style={styles.botaoSeta}
            >
              →
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {resultado && dadosFipe && (
          <Animated.View
            style={[
              styles.relatorio,
              {
                opacity:
                  relatorioAnim,

                transform: [
                  {
                    translateY:
                      relatorioTranslate,
                  },
                ],
              },
            ]}
          >
            <Text
              style={
                styles.relatorioMini
              }
            >
              TORQUELAB VEHICLE REPORT
            </Text>

            <Text
              style={
                styles.relatorioTitulo
              }
            >
              Relatório do veículo
            </Text>

            <Text
              style={
                styles.relatorioCarro
              }
            >
              {dadosFipe.brand}
            </Text>

            <Text
              style={
                styles.relatorioModelo
              }
            >
              {dadosFipe.model}
            </Text>

            <View
              style={styles.notaCard}
            >
              <Text
                style={styles.notaLabel}
              >
                ÍNDICE TORQUELAB
              </Text>

              <Text
                style={styles.notaNumero}
              >
                {resultado.nota}/100
              </Text>

              <Text
                style={
                  styles.classificacaoTexto
                }
              >
                {
                  resultado.classificacao
                }
              </Text>

              <View
                style={styles.barraFundo}
              >
                <Animated.View
                  style={[
                    styles.barraValor,
                    {
                      width:
                        larguraBarra,
                    },
                  ]}
                />
              </View>
            </View>

            <View
              style={
                styles.resultadoBox
              }
            >
              <Text
                style={
                  styles.resultadoLabel
                }
              >
                DESEMPENHO
              </Text>

              <Text
                style={
                  styles.resultadoValor
                }
              >
                {resultado.desempenho}
              </Text>
            </View>

            <View
              style={
                styles.resultadoBox
              }
            >
              <Text
                style={
                  styles.resultadoLabel
                }
              >
                SAÚDE ESTIMADA
              </Text>

              <Text
                style={
                  styles.resultadoValor
                }
              >
                {resultado.saude}%
              </Text>
            </View>

            <View
              style={
                styles.resultadoBox
              }
            >
              <Text
                style={
                  styles.resultadoLabel
                }
              >
                CONSUMO ESTIMADO
              </Text>

              <Text
                style={
                  styles.resultadoValor
                }
              >
                {resultado.consumo} km/L
              </Text>
            </View>

            <View
              style={
                styles.resultadoBox
              }
            >
              <Text
                style={
                  styles.resultadoLabel
                }
              >
                CATEGORIA
              </Text>

              <Text
                style={
                  styles.resultadoValor
                }
              >
                {resultado.categoria}
              </Text>
            </View>

            {resultado.alertas.length >
              0 && (
              <View
                style={styles.alertas}
              >
                <Text
                  style={
                    styles.alertasTitulo
                  }
                >
                  PONTOS DE ATENÇÃO
                </Text>

                {resultado.alertas.map(
                  (alerta, index) => (
                    <Text
                      key={index}
                      style={
                        styles.alertaTexto
                      }
                    >
                      • {alerta}
                    </Text>
                  )
                )}
              </View>
            )}

            <TouchableOpacity
              style={
                styles.novaAnalise
              }
              onPress={limpar}
            >
              <Text
                style={
                  styles.novaAnaliseTexto
                }
              >
                NOVA ANÁLISE
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      <SeletorModal
        visible={modalMarca}
        titulo="Selecionar marca"
        itens={marcas}
        onClose={() =>
          setModalMarca(false)
        }
        onSelect={selecionarMarca}
      />

      <SeletorModal
        visible={modalModelo}
        titulo="Selecionar modelo"
        itens={modelos}
        onClose={() =>
          setModalModelo(false)
        }
        onSelect={selecionarModelo}
      />

      <SeletorModal
        visible={modalAno}
        titulo="Selecionar ano"
        itens={anos}
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
    backgroundColor: "#07090c",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 45,
    paddingBottom: 50,
    maxWidth: 900,
    width: "100%",
    alignSelf: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },

  logoBox: {
    width: 58,
    height: 58,
    backgroundColor: "#e92335",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  logoTexto: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },

  nomeEmpresa: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 2.5,
  },

  nomeEmpresa2: {
    color: "#e92335",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 4,
  },

  heroTitulo: {
    color: "#fff",
    fontSize: 35,
    fontWeight: "900",
  },

  heroDescricao: {
    color: "#949ba7",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
  },

  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 18,
    marginBottom: 25,
  },

  onlineBolinha: {
    width: 7,
    height: 7,
    borderRadius: 10,
    backgroundColor: "#46d477",
    marginRight: 8,
  },

  onlineTexto: {
    color: "#8e96a2",
    fontSize: 10,
    fontWeight: "900",
  },

  card: {
    backgroundColor: "#101318",
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
  },

  cardCabecalho: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  numeroBox: {
    width: 45,
    height: 45,
    backgroundColor: "#1b1f26",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  numeroTexto: {
    color: "#e92335",
    fontWeight: "900",
  },

  cardTitulo: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 15,
  },

  cardSubtitulo: {
    color: "#707783",
    fontSize: 12,
  },

  label: {
    color: "#747c88",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 7,
  },

  seletor: {
    backgroundColor: "#191d23",
    borderRadius: 13,
    padding: 15,
    marginBottom: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  seletorBloqueado: {
    opacity: 0.4,
  },

  seletorTexto: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },

  placeholder: {
    color: "#69707c",
  },

  chevron: {
    color: "#e92335",
    fontSize: 27,
  },

  input: {
    backgroundColor: "#191d23",
    borderRadius: 13,
    padding: 15,
    color: "#fff",
    marginBottom: 17,
  },

  carregandoFipe: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },

  carregandoFipeTexto: {
    color: "#aaa",
    marginLeft: 10,
  },

  fipeCard: {
    backgroundColor: "#171b21",
    borderRadius: 18,
    padding: 17,
    marginTop: 10,
  },

  fipeMini: {
    color: "#717985",
    fontSize: 9,
    fontWeight: "900",
  },

  fipePreco: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "900",
    marginVertical: 5,
  },

  fipeModelo: {
    color: "#fff",
    marginTop: 10,
    marginBottom: 10,
  },

  fipeValor: {
    color: "#ddd",
    marginBottom: 5,
  },

  botaoAnalisar: {
    backgroundColor: "#e92335",
    borderRadius: 17,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  botaoMini: {
    color: "#ffadb4",
    fontSize: 8,
    fontWeight: "900",
  },

  botaoTexto: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },

  botaoSeta: {
    color: "#fff",
    fontSize: 27,
  },

  relatorio: {
    backgroundColor: "#101318",
    borderRadius: 24,
    padding: 20,
    marginBottom: 30,
  },

  relatorioMini: {
    color: "#e92335",
    fontSize: 9,
    fontWeight: "900",
  },

  relatorioTitulo: {
    color: "#fff",
    fontSize: 27,
    fontWeight: "900",
    marginTop: 6,
  },

  relatorioCarro: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 22,
  },

  relatorioModelo: {
    color: "#8e959f",
    marginTop: 4,
    marginBottom: 15,
  },

  notaCard: {
    backgroundColor: "#171b21",
    padding: 18,
    borderRadius: 17,
  },

  notaLabel: {
    color: "#727985",
    fontSize: 9,
    fontWeight: "900",
  },

  notaNumero: {
    color: "#fff",
    fontSize: 43,
    fontWeight: "900",
  },

  classificacaoTexto: {
    color: "#e92335",
    fontWeight: "900",
  },

  barraFundo: {
    height: 7,
    backgroundColor: "#2a3038",
    borderRadius: 20,
    marginTop: 14,
    overflow: "hidden",
  },

  barraValor: {
    height: "100%",
    backgroundColor: "#e92335",
  },

  resultadoBox: {
    backgroundColor: "#171b21",
    borderRadius: 16,
    padding: 15,
    marginTop: 10,
  },

  resultadoLabel: {
    color: "#6e7580",
    fontSize: 9,
    fontWeight: "900",
  },

  resultadoValor: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 5,
  },

  alertas: {
    backgroundColor: "#25191b",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },

  alertasTitulo: {
    color: "#ff6975",
    fontWeight: "900",
    marginBottom: 10,
  },

  alertaTexto: {
    color: "#ddd",
    marginBottom: 5,
  },

  novaAnalise: {
    backgroundColor: "#22272e",
    padding: 16,
    borderRadius: 14,
    marginTop: 15,
  },

  novaAnaliseTexto: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "900",
  },

  modalFundo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    justifyContent: "center",
    padding: 18,
  },

  modalCard: {
    backgroundColor: "#101318",
    borderRadius: 22,
    padding: 18,
    maxHeight: "82%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  modalPequeno: {
    color: "#e92335",
    fontSize: 8,
    fontWeight: "900",
  },

  modalTitulo: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "900",
  },

  fecharModal: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  fecharModalTexto: {
    color: "#fff",
    fontSize: 25,
  },

  buscaInput: {
    backgroundColor: "#191d23",
    padding: 14,
    borderRadius: 12,
    color: "#fff",
    marginBottom: 12,
  },

  listaModal: {
    flexGrow: 0,
  },

  itemModal: {
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  itemModalTexto: {
    color: "#ddd",
    flex: 1,
  },

  itemModalSeta: {
    color: "#e92335",
    fontSize: 23,
  },

  semResultado: {
    color: "#777",
    textAlign: "center",
    padding: 30,
  },
});