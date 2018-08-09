
//=============================================================================
// SAN_ActorBodysizeReactor.js
//=============================================================================
// Copyright (c) 2016 Sanshiro
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc SAN_ActorBodysizeReactor ver2.12
 * @author Sanshiro https://twitter.com/rev2nym
 * 
 * @help
 * It's possible to commercial use, distribute, and modify under the MIT license.
 * But, don't eliminate and don't alter a comment of the beginning.
 * If it's good, please indicate an author name on credit.
 * 
 * Author doesn't shoulder any responsibility in all kind of damage by using this.
 * And please don't expect support. X(
 *
 * 日本語ヘルプはプラグインファイルをご覧ください。
 * 
 * @param MaleAverageHeight
 * @desc Average height of adult male. [cm]
 * @default 170.8
 * 
 * @param FemaleAverageHeight
 * @desc Average height of adult female. [cm]
 * @default 158.1
 * 
 */

/*:ja
 * @plugindesc アクターボディサイズリアクター ver2.12
 * 職業、装備、スキル、ステートからボディサイズを算出します。
 * @author サンシロ https://twitter.com/rev2nym
 * @version 2.12 2016/07/16 職業等の変化がボディサイズに反映されない不具合を修正。
 * 2.11 2016/07/16 ディレクトリパスに'www'が含まれるとエディタシーンのセーブ時にエラー終了する不具合を修正。
 * 2.10 2016/07/07 足長と手長を追加。平均身長設定プラグインパラメータ追加。
 * 2.00 2016/07/01 エディタ機能追加。
 * 1.00 2016/06/28 公開。
 * 
 * @help
 * このプラグインには以下の2つの機能を実装しています。
 *
 * 1. ボディサイズ反映機能
 * アクターに性別、年齢、身長、体重、スリーサイズ等のパラメータを追加し、
 * それらボディサイズに職業、装備、スキル、ステートを反映する機能です。
 *
 * 2. データ編集機能
 * ボディサイズ反映機能のデータを編集する機能です。
 *
 * プロジェクトのdataフォルダに以下のJSONファイルを保存してください。
 *   SAN_ActorBodysizeReactor.json
 * このJSONファイルはプラグインと併せて公開されます。
 *
 * 1. ボディサイズ反映機能
 * アクター、職業、装備、スキル、ステートに設定したパラメータセットから
 * ボディサイズを算出します。パラメータは上書きマージされ、
 * 適用優先度の高いパラメータがボディサイズの算出に採用されます。
 * 適用優先度は アクター < 職業 < 装備 < スキル < ステート の順です。
 *
 * RPGツクールMVのデータベース編集画面のアクター、職業、装備、スキル、ステートの
 * メモ欄に以下の書式で読み込むデータの設定を行います。
 * 
 *   <SAN_ActorBodysizeReactor:[
 *     {"name":"パラメータセット名称"}
 *   ]>
 * 
 * "name" : パラメータセットのデータの名称です。
 *          データの内容は上記JSONファイルに記述されます。
 *
 * 2. データ編集機能
 * ボディサイズ反映機能で使用するデータをゲーム上で編集します。
 * 以下のプラグインコマンドを実行してください。
 *   SAN_ActorBodysizeReactor CallEditor
 * データの保存や削除はローカルモード時（テスト実行時やexe実行時）のみ可能です。
 * 
 * 
 * MITライセンスのもと、商用利用、改変、再配布が可能です。
 * ただし冒頭のコメントは削除や改変をしないでください。
 * よかったらクレジットに作者名を記載してください。
 * 
 * これを利用したことによるいかなる損害にも作者は責任を負いません。
 * サポートは期待しないでください＞＜。
 * 
 * @param MaleAverageHeight
 * @desc 成人男性の平均身長[cm]です。
 * 計算結果には若干の誤差が発生します。
 * @default 170.8
 * 
 * @param FemaleAverageHeight
 * @desc 成人女性の平均身長[cm]です。
 * 計算結果には若干の誤差が発生します。
 * @default 158.1
 * 
 */

var Imported = Imported || {};
Imported.SAN_ActorBodysizeReactor = true;

var Sanshiro = Sanshiro || {};
Sanshiro.ActorBodysizeReactor = Sanshiro.ActorBodysizeReactor || {};
Sanshiro.ActorBodysizeReactor.version = '2.12';

(function (SAN) {
'use strict';

//-----------------------------------------------------------------------------
// DataManager
//
// データマネージャ

// データベースファイル
DataManager._databaseFiles.push(
    { name: '$dataActorBodysizeReactor', src: 'SAN_ActorBodysizeReactor.json' }
);

//-----------------------------------------------------------------------------
// SceneManager
//
// シーンマネージャ

// シーン判定
SceneManager.scene = function () {
    return this._scene;
};

//-----------------------------------------------------------------------------
// ActorBodysizeReactor
//
// アクターボディサイズジェネレータ

function ActorBodysizeReactor() {
    this.initialize.apply(this, arguments);
}

// 基礎体格係数
ActorBodysizeReactor.coefficients = [
    {
        sex: 'male',    // 性別（男性）
        height: [       // 身長
            -1.89484891626886e-18,
             2.11054241280265e-15,
            -9.58297051249509e-13,
             2.33722871560921e-10,
            -3.45672504204173e-08,
             3.31366375943377e-06,
            -2.06053689138837e-04,
             1.04130444755281e-02,
             3.32991414387324e-01
        ],
        tBust: 0.49,    // トップバスト
        waist: 0.41,    // ウエスト
        hip:   0.51,    // ヒップ
        foot:  0.1475,  // 足
        hand:  0.11     // 手
    },
    {
        sex: 'female',  // 性別（女性）
        height: [       // 身長
             6.57808943336300e-19,
            -7.29801449739104e-16,
             2.82553312573745e-13,
            -3.29547813508156e-11,
            -5.97905233253186e-09,
             2.01968903108656e-06,
            -2.06166212092349e-04,
             1.22341254128593e-02,
             3.29462866340373e-01
        ],
        tBust: 0.54,    // トップバスト
        uBust: 0.44,    // アンダーバスト
        waist: 0.38,    // ウエスト
        hip:   0.54,    // ヒップ
        thigh: 0.31,    // 太腿
        foot:  0.1475,  // 足
        hand:  0.11     // 手
    }
];

// プラグインバージョン一致判定
ActorBodysizeReactor.prototype.isCurrentVersion = function () {
    return this._version === SAN.ActorBodysizeReactor.version;
};

// オブジェクト初期化
ActorBodysizeReactor.prototype.initialize = function () {
    this._version = SAN.ActorBodysizeReactor.version;
    this._actorId = 0;
    this.initBaseParameters();
    this.initParameters();
};

// ベースパラメータ初期化
ActorBodysizeReactor.prototype.initBaseParameters = function () {
    this._baseParameters = this.templateParameters();
};

// パラメータ初期化
ActorBodysizeReactor.prototype.initParameters = function () {
    this._parameters = this.templateParameters();
};

// パラメータテンプレート
ActorBodysizeReactor.prototype.templateParameters = function () {
    return {
        name:    'new',     // データ名称
        sex:      null,     // 性別
        mAge:     null,     // 月齢
    	height:   null,     // 身長係数
    	weight:   null,     // 体重係数
	    tBust:    null,     // トップバスト係数
        uBust:    null,     // アンダーバスト係数
    	waist:    null,     // ウエスト係数
        hip:      null,     // ヒップ係数
    	thigh:    null,     // 太腿係数
        foot:     null,     // 足長係数
        hand:     null,     // 手長係数
        fatness:  null      // 肥満係数
    };
};

// クリア
ActorBodysizeReactor.prototype.clear = function () {
    this.initBaseParameters();
    this.initParameters();
};

// セットアップ
ActorBodysizeReactor.prototype.setupByActorId = function (actorId) {
    this.initBaseParameters();
    this._actorId = actorId;
    var actor = $gameActors.actor(this._actorId);
    var name = this.nameFromItem(actor.actor());
    if (name === 'random') {
        this.setupRandom();
    } else {
        var parameters = this.parametersFromDatabase(name);
        this.setupByParameters(parameters);
    }
    this.refresh();
};

// 乱数によるベース個体体格係数のセットアップ
ActorBodysizeReactor.prototype.setupRandom = function () {
    this.initBaseParameters();
    this.setBaseSexRandom();
    // this.setBaseMAgeRandom();
    this.setBaseHeightRandom();
    this.setBaseWeightRandom();
    this.setBaseTBustRandom();
    this.setBaseUBustRandom();
    this.setBaseWaistRandom();
    this.setBaseHipRandom();
    this.setBaseThighRandom();
    this.setBaseFootRandom();
    this.setBaseHandRandom();
    this.setBaseFatnessRandom();
    this.refresh();
};

// パラメータによるセットアップ
ActorBodysizeReactor.prototype.setupByParameters = function (parameters) {
    this.initBaseParameters();
    for(var key in parameters) {
        this._baseParameters[key] = parameters[key];
    }
    this.refresh();
};

// リフレッシュ
ActorBodysizeReactor.prototype.refresh = function () {
    this.initParameters();
    var items = this.items();
    var names = this.namesFromItems(items);
    this.mergeParameters(this._baseParameters);
    names.forEach(function (name){
        this.mergeParameters(this.parametersFromDatabase(name));
    }, this);
    this._parameters.name = this._baseParameters.name;
};

// アイテムリスト
ActorBodysizeReactor.prototype.items = function () {
    var items = [];
    var actor = $gameActors.actor(this._actorId);
    if (!!actor) {
        items.push(actor.currentClass());
        items = items.concat(actor.equips());
        items = items.concat(actor.skills());
        items = items.concat(actor.states());
        items = items.filter(function (item) {
            return !!item;
        });
    }
    return items;
};

// アイテムリストからのリアクター名称リスト
ActorBodysizeReactor.prototype.namesFromItems = function (items) {
    var names = [];
    items.forEach(function(item) {
        var name = this.nameFromItem(item);
        if (!!name) {
            names.push(name);
        }
    }, this);
    return names;
};

// アイテムからのリアクター名称
ActorBodysizeReactor.prototype.nameFromItem = function (item) {
    var note = item.meta.SAN_ActorBodysizeReactor;
    if (!note) {
        return undefined;
    }
    var meta = JSON.parse(note);
    if (!!meta[0]) {
        return meta[0].name;
    } else {
        return undefined;
    }
};

// データベースからのリアクターパラメータ
ActorBodysizeReactor.prototype.parametersFromDatabase = function (name) {
    var parameters = $dataActorBodysizeReactor.filter(function (parameters) {
        return parameters.name === name;
    }, this)[0];
    return parameters;
};

// パラメータのマージ
ActorBodysizeReactor.prototype.mergeParameters = function (parameters) {
    for (var key in parameters) {
        if (key !== 'name' &&
            parameters[key] !== null &&
            parameters[key] !== undefined)
        {
            this._parameters[key] = parameters[key];
            if (key === 'mAge') {
                this._parameters[key] = Math.max(96, this._parameters[key]);
            } else if (key !== 'sex') {
                this._parameters[key] = Math.min(Math.max(0.0, this._parameters[key]), 2.0);
            }
        }
    }
};

// 分布調整乱数
ActorBodysizeReactor.prototype.distributedRandom = function (trial) {
    var value = 0.0;
    for (var i = 0; i < trial; i++) {
        value += Math.random();
    }
    return value / trial;
};

// ベース名称の設定
ActorBodysizeReactor.prototype.setBaseName = function (name) {
    this._baseParameters.name = name;
    this._parameters.name = name;
};

// ベース性別の設定
ActorBodysizeReactor.prototype.setBaseSex = function (sex) {
    if (sex === 'male' || 'female') {
        this._baseParameters.sex = sex;
    }
    this.refreshParameters();
};

// ベース月齢の設定
ActorBodysizeReactor.prototype.setBaseMAge = function (mAge) {
    this._baseParameters.mAge = Math.max(96, mAge);
    this.refreshParameters();
};

// ベース身長係数の設定
ActorBodysizeReactor.prototype.setBaseHeight = function (height) {
    this._baseParameters.height = height;
    this.refreshParameters();
};

// ベース体重係数の設定
ActorBodysizeReactor.prototype.setBaseWeight = function (weight) {
    this._baseParameters.weight = weight;
    this.refreshParameters();
};

// ベーストップバスト係数の設定
ActorBodysizeReactor.prototype.setBaseTBust = function (tBust) {
    this._baseParameters.tBust = tBust
    this.refreshParameters();
};

// ベースアンダーバスト係数の設定
ActorBodysizeReactor.prototype.setBaseUBust = function (uBust) {
    this._baseParameters.uBust = uBust;
    this.refreshParameters();
};

// ベースウエスト係数の設定
ActorBodysizeReactor.prototype.setBaseWaist = function (waist) {
    this._baseParameters.waist = waist;
    this.refreshParameters();
};

// ベースヒップ係数の設定
ActorBodysizeReactor.prototype.setBaseHip = function (hip) {
    this._baseParameters.hip = hip;
    this.refreshParameters();
};

// ベース太腿係数の設定
ActorBodysizeReactor.prototype.setBaseThigh = function (thigh) {
    this._baseParameters.thigh = thigh;
    this.refreshParameters();
};

// ベース足長係数の設定
ActorBodysizeReactor.prototype.setBaseFoot = function (foot) {
    this._baseParameters.foot = foot;
    this.refreshParameters();
};

// ベース手長係数の設定
ActorBodysizeReactor.prototype.setBaseHand = function (hand) {
    this._baseParameters.hand = hand;
    this.refreshParameters();
};

// ベース肥満係数の設定
ActorBodysizeReactor.prototype.setBaseFatness = function (fatness) {
    this._baseParameters.fatness = fatness;
    this.refreshParameters();
};

// ベース性別のランダム設定
ActorBodysizeReactor.prototype.setBaseSexRandom = function () {
    this.setBaseSex(Math.random() > 0.5 ? 'male' : 'female');
};

// ベース月齢のランダム設定
ActorBodysizeReactor.prototype.setBaseMAgeRandom = function () {
    this.setBaseMAge(Math.floor(96 + (1200 - 96) * Math.random()));
};

// ベース身長係数のランダム設定
ActorBodysizeReactor.prototype.setBaseHeightRandom = function () {
    this.setBaseHeight(this.distributedRandom(5) * 2.0);
};

// ベース体重係数のランダム設定
ActorBodysizeReactor.prototype.setBaseWeightRandom = function () {
    this.setBaseWeight(this.distributedRandom(5) * 2.0);
};

// ベーストップバスト係数のランダム設定
ActorBodysizeReactor.prototype.setBaseTBustRandom = function () {
    this.setBaseTBust(this.distributedRandom(5) * 2.0);
};

// ベースアンダーバスト係数のランダム設定
ActorBodysizeReactor.prototype.setBaseUBustRandom = function () {
    this.setBaseUBust(this.distributedRandom(5) * 2.0);
};

// ベースウエスト係数のランダム設定
ActorBodysizeReactor.prototype.setBaseWaistRandom = function () {
    this.setBaseWaist(this.distributedRandom(5) * 2.0);
};

// ベースヒップ係数のランダム設定
ActorBodysizeReactor.prototype.setBaseHipRandom = function () {
    this.setBaseHip(this.distributedRandom(5) * 2.0);
};

// ベース太腿係数のランダム設定
ActorBodysizeReactor.prototype.setBaseThighRandom = function () {
    this.setBaseThigh(this.distributedRandom(5) * 2.0);
};

// ベース足長係数のランダム設定
ActorBodysizeReactor.prototype.setBaseFootRandom = function () {
    this.setBaseFoot(this.distributedRandom(5) * 2.0);
};

// ベース手長係数のランダム設定
ActorBodysizeReactor.prototype.setBaseHandRandom = function () {
    this.setBaseHand(this.distributedRandom(5) * 2.0);
};

// ベース肥満係数のランダム設定
ActorBodysizeReactor.prototype.setBaseFatnessRandom = function () {
    this.setBaseFatness(this.distributedRandom(15) * 2.0);
};

// ベース月齢の増減
ActorBodysizeReactor.prototype.gainBaseMAge = function (mAge) {
    this.setBaseMAge(this._baseParameters.mAge + mAge);
};

// ベース身長係数の増減
ActorBodysizeReactor.prototype.gainBaseHeight = function (height) {
    this.setBaseHeight(this._baseParameters.height + height);
};

// ベース体重係数の増減
ActorBodysizeReactor.prototype.gainBaseWeight = function (weight) {
    this.setBaseWeight(this._baseParameters.weight + weight);
};

// ベーストップバスト係数の増減
ActorBodysizeReactor.prototype.gainBaseTBust = function (tBust) {
    this.setBaseTBust(this._baseParameters.tBust + tBust);
};

// ベースアンダーバスト係数の増減
ActorBodysizeReactor.prototype.gainBaseUBust = function (uBust) {
    this.setBaseUBust(this._baseParameters.uBust + uBust);
};

// ベースウエスト係数の増減
ActorBodysizeReactor.prototype.gainBaseWaist = function (waist) {
    this.setBaseWaist(this._baseParameters.waist + waist);
};

// ベースヒップ係数の増減
ActorBodysizeReactor.prototype.gainBaseHip = function (hip) {
    this.setBaseHip(this._baseParameters.hip + hip);
};

// ベース太腿係数の増減
ActorBodysizeReactor.prototype.gainBaseThigh = function (thigh) {
    this.setBaseThigh(this._baseParameters.thigh + thigh);
};

// ベース足長係数の増減
ActorBodysizeReactor.prototype.gainBaseFoot = function (foot) {
    this.setBaseFoot(this._baseParameters.foot + foot);
};

// ベース手長係数の増減
ActorBodysizeReactor.prototype.gainBaseHand = function (hand) {
    this.setBaseHand(this._baseParameters.hand + hand);
};

// ベース肥満係数の増減
ActorBodysizeReactor.prototype.gainBaseFatness = function (fatness) {
    this.setBaseFatness(this._baseParameters.fatness + fatness);
};

// 基礎体格係数
ActorBodysizeReactor.prototype.coefficients = function () {
    var isSameSex = function(coefficients) { return coefficients.sex === this.sex(); };
    return ActorBodysizeReactor.coefficients.filter(isSameSex, this)[0];
};

// ベースパラメータ
ActorBodysizeReactor.prototype.baseParameters = function () {
    return this._baseParameters;
}

// ベース性別
ActorBodysizeReactor.prototype.baseSex = function () {
    return (
        this._baseParameters.sex === null ? 'male':
        this._baseParameters.sex
    );
};

// ベース月齢
ActorBodysizeReactor.prototype.baseMAge = function () {
    return (
        this._baseParameters.mAge === null ? 216 :
        this._baseParameters.mAge
    );
};

// パラメータ
ActorBodysizeReactor.prototype.parameters = function () {
    return this._parameters;
};

// 名称
ActorBodysizeReactor.prototype.name = function () {
    return this._parameters.name;
};

// 性別
ActorBodysizeReactor.prototype.sex = function () {
    return (
        this._parameters.sex === null ? 'male' :
        this._parameters.sex
    );
};

// 月齢
ActorBodysizeReactor.prototype.mAge = function () {
    return (
        this._parameters.mAge === null ? 216 :
        this._parameters.mAge
    );
};

// 平均身長 [cm]
ActorBodysizeReactor.prototype.averageHeight = function () {
    var pluginParameters = PluginManager.parameters('SAN_ActorBodysizeReactor');
    var key = (this.sex() === 'male' ? 'MaleAverageHeight' : 'FemaleAverageHeight');
    return Number(pluginParameters[key]);
};

// 身長 [cm]
ActorBodysizeReactor.prototype.height = function () {
    // 基礎体格係数と月齢の7次近似多項式から正規化身長を算出
    var mAgeParam = Math.min(Math.max(96, this.mAge()), 204);
    var heightCoefs = this.coefficients().height;
    var height = 0.0;
    heightCoefs.forEach(function (heightCoef) {
        height = height * mAgeParam + heightCoef;
    }, this);
    // 平均身長を乗算
    height *= this.averageHeight();
    // 個体体格係数によって±15.0%変化
    var heightParam = (
        this._parameters.height === null ? 1.0 :
        this._parameters.height
    );
    height *= (0.85 + 0.15 * heightParam);
    return height;
};

// 体重 [kg]
ActorBodysizeReactor.prototype.weight = function () {
    // 身長とローレル指数値（標準130.0）を基準に算出
    var weight = 130.0 * Math.pow(this.height(), 3) / 10000000.0;
    // 個体体格係数によって±10.0%変化
    var weigntParam = (
        this._parameters.weight === null ? 1.0 :
        this._parameters.weight
    );
    weight *= (0.90 + 0.10 * weigntParam);
    // 肥満補正
    weight *= this.fatnessRatio();
    return weight;
};

// 肥満
ActorBodysizeReactor.prototype.fatnessRatio = function () {
    // 個体肥満係数0.0～2.0に対してBMI値が17.0～42.0の範囲に収まるよう調整
    var fatnessParam = (
        this._parameters.fatness === null ? 1.0 :
        this._parameters.fatness
    );
    if (fatnessParam < 1.0) {
        return (17.0 + ( 5.0 *  fatnessParam)      )  / 22.0;
    } else {
        return (22.0 + (20.0 * (fatnessParam - 1.0))) / 22.0;
    }
};

// トップバスト [cm]
ActorBodysizeReactor.prototype.tBust = function () {
    var tBustCoef = this.coefficients().tBust;
    var tBust = this.height() * tBustCoef;
    // 個体体格係数によって±7.5%変化
    var tBustParam = (
        this._parameters.tBust === null ? 1.0 :
        this._parameters.tBust
    );
    tBust *= 0.925 + 0.075 * tBustParam;
    // 太るとウエストの1/3のペースでトップバストが増加
    tBust *= Math.pow((1.0 + (this.fatnessRatio() - 1.0) / 3.0), (1.0 / 3.0));
    return tBust;
};

// アンダーバスト [cm]
ActorBodysizeReactor.prototype.uBust = function () {
    // 男性ならundefined
    if (this.sex() === 'male') {
        return undefined;
    }
    var uBustCoef = this.coefficients().uBust;
    var uBust = this.height() * uBustCoef;
    // 個体体格係数によって±5.0%変化
    var uBustParam = (
        this._parameters.uBust === null ? 1.0 :
        this._parameters.uBust
    );
    uBust *= 0.95 + 0.05 * uBustParam;
    // 太るとウエストの1/3のペースでトップバストが増加
    uBust *= Math.pow((1.0 + (this.fatnessRatio() - 1.0) / 3.0), (1.0 / 3.0));
    return uBust;
};

// ウエスト [cm]
ActorBodysizeReactor.prototype.waist = function () {
    var waistCoef = this.coefficients().waist;
    var waist = this.height() * waistCoef;
    // 個体体格係数によって±5.0%変化
    var waistParam = (
        this._parameters.waist === null ? 1.0 :
        this._parameters.waist
    );
    waist *= 0.95 + 0.05 * waistParam;
    // 太ると体重の-3乗のペースでウエストが増加
    waist *= Math.pow((1.0 + (this.fatnessRatio() - 1.0)), (1.0 / 3.0));
    return waist;
};

// ヒップ [cm]
ActorBodysizeReactor.prototype.hip = function () {
    var hipCoef = this.coefficients().hip;
    var hip = this.height() * hipCoef;
    // 個体体格係数によって±5.0%変化
    var hipParam = (
        this._parameters.hip === null ? 1.0 :
        this._parameters.hip
    );
    hip *= 0.95 + 0.05 * hipParam;
    // 太るとウエストの1/2のペースでヒップが増加
    hip *= Math.pow((1.0 + (this.fatnessRatio() - 1.0) / 2.0), (1.0 / 3.0));
    return hip;
};

// 太腿 [cm]
ActorBodysizeReactor.prototype.thigh = function () {
    if (this.sex() === 'male') {
        return undefined;
    }
    var thighCoef = this.coefficients().thigh;
    var thigh = this.height() * thighCoef;
    // 個体体格係数によって±5.0%変化
    var thighParam = (
        this._parameters.thigh === null ? 1.0 :
        this._parameters.thigh
    );
    thigh *= 0.95 + 0.05 * thighParam;
    // 太るとウエストの1/2のペースで太腿が増加
    thigh *= Math.pow((1.0 + (this.fatnessRatio() - 1.0) / 2.0), (1.0 / 3.0));
    return thigh;
};

// 足長 [cm]
ActorBodysizeReactor.prototype.foot = function () {
    var footCoef = this.coefficients().foot;
    var foot = this.height() * footCoef;
    // 個体体格係数によって±5.0%変化
    var footParam = (
        this._parameters.foot === null ? 1.0 :
        this._parameters.foot
    );
    foot *= 0.95 + 0.05 * footParam;
    return foot;
};

// 手長 [cm]
ActorBodysizeReactor.prototype.hand = function () {
    var handCoef = this.coefficients().hand;
    var hand = this.height() * handCoef;
    // 個体体格係数によって±5.0%変化
    var handParam = (
        this._parameters.hand === null ? 1.0 :
        this._parameters.hand
    );
    hand *= 0.95 + 0.05 * handParam;
    return hand;
};

// BMI値
ActorBodysizeReactor.prototype.bmi = function () {
    return this.weight() / Math.pow(this.height() * 0.01, 2);
};

// ローレル指数値
ActorBodysizeReactor.prototype.rohrer = function () {
    return this.weight() / Math.pow(this.height(), 3) * 10000000.0;
};

// カップ
ActorBodysizeReactor.prototype.cup = function () {
    if (this.sex() === 'male') {
        return undefined;
    }
    var bustDiff = this.tBust() - this.uBust();
    return (
        bustDiff <  5.0 ? "under" :
        bustDiff <  7.5 ? "AAA" :
        bustDiff < 10.0 ? "AA" :
        bustDiff < 12.5 ? "A" :
        bustDiff < 15.0 ? "B" :
        bustDiff < 17.5 ? "C" :
        bustDiff < 20.0 ? "D" :
        bustDiff < 22.5 ? "E" :
        bustDiff < 25.0 ? "F" :
        bustDiff < 27.5 ? "G" :
        bustDiff < 30.0 ? "H" :
        bustDiff < 32.5 ? "I" :
        "over"
    );
};

// デバッグ用表示
ActorBodysizeReactor.prototype.disp = function () {
    var str = "";
    str += "Sex : "    + this.sex()    + "\n";
    str += "Age : "    + this.mAge()   + "\n";
    str += "Height : " + this.height() + "\n";
    str += "Weight : " + this.weight() + "\n";
    str += "Bust : "   + this.tBust()  + "\n";
    str += "Waist : "  + this.waist()  + "\n";
    str += "Hip : "    + this.hip()    + "\n";
    str += "Thigh : "  + this.thigh()  + "\n";
    str += "Foot : "   + this.foot()   + "\n";
    str += "Hand : "   + this.hand()   + "\n";
    str += "Cup :"     + this.cup()    + "\n";
    str += "BMI :"     + this.bmi()    + "\n";
    str += "Rohrer :"  + this.rohrer() + "\n";
    return str;
};

//-----------------------------------------------------------------------------
// Game_Actor
//
// アクター

// オブジェクト初期化
SAN.ActorBodysizeReactor.Game_Actor_initialize = Game_Actor.prototype.initialize;
Game_Actor.prototype.initialize = function (actorId) {
    SAN.ActorBodysizeReactor.Game_Actor_initialize.call(this, actorId);
};

// ボディサイズリアクター
Game_Actor.prototype.bodysizeReactor = function () {
    if (!this._bodysizeReactor ||
        !this._bodysizeReactor.isCurrentVersion ||
        !this._bodysizeReactor.isCurrentVersion())
    {
        this._bodysizeReactor = new ActorBodysizeReactor();
        this._bodysizeReactor.setupByActorId(this._actorId);
    }
    return this._bodysizeReactor;
};

// ボディサイズリアクターのリフレッシュ
Game_Actor.prototype.refreshBodysizeReactor = function () {
    this.bodysizeReactor().refresh();
};

// 職業の変更
SAN.ActorBodysizeReactor.Game_Actor_changeClass = Game_Actor.prototype.changeClass;
Game_Actor.prototype.changeClass = function (classId, keepExp) {
    SAN.ActorBodysizeReactor.Game_Actor_changeClass.call(this, classId, keepExp);
    this.refreshBodysizeReactor();
};

// 装備の変更
SAN.ActorBodysizeReactor.Game_Actor_changeEquip = Game_Actor.prototype.changeEquip;
Game_Actor.prototype.changeEquip = function (slotId, item) {
    SAN.ActorBodysizeReactor.Game_Actor_changeEquip.call(this, slotId, item);
    this.refreshBodysizeReactor();
};

// 装備の強制変更
SAN.ActorBodysizeReactor.Game_Actor_forceChangeEquip = Game_Actor.prototype.forceChangeEquip;
Game_Actor.prototype.forceChangeEquip = function (slotId, item) {
    SAN.ActorBodysizeReactor.Game_Actor_forceChangeEquip.call(this, slotId, item);
    this.refreshBodysizeReactor();
};

// ステート情報をクリア
SAN.ActorBodysizeReactor.Game_Actor_clearStates = Game_Actor.prototype.clearStates;
Game_Actor.prototype.clearStates = function () {
    SAN.ActorBodysizeReactor.Game_Actor_clearStates.call(this);
    if (SceneManager.scene().constructor !== Scene_Boot &&
        SceneManager.scene().constructor !== Scene_Title)
    {
        this.refreshBodysizeReactor();
    }
};

// ステートの消去
SAN.ActorBodysizeReactor.Game_Actor_eraseState = Game_Actor.prototype.eraseState;
Game_Actor.prototype.eraseState = function (stateId) {
    SAN.ActorBodysizeReactor.Game_Actor_eraseState.call(this, stateId);
    this.refreshBodysizeReactor();
};

// ステートの付加
SAN.ActorBodysizeReactor.Game_Actor_addState = Game_Actor.prototype.addState;
Game_Actor.prototype.addState = function (stateId) {
    SAN.ActorBodysizeReactor.Game_Actor_addState.call(this, stateId);
    this.refreshBodysizeReactor();
};

//-----------------------------------------------------------------------------
// Scene_Menu
//
// メニューシーン

// メニューコマンドウィンドウの作成
SAN.ActorBodysizeReactor.Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
Scene_Menu.prototype.createCommandWindow = function() {
    SAN.ActorBodysizeReactor.Scene_Menu_createCommandWindow.call(this);
    this._commandWindow.setHandler('bodysize', this.commandPersonal.bind(this));
};

// アクター選択決定処理
SAN.ActorBodysizeReactor.Scene_Menu_onPersonalOk = Scene_Menu.prototype.onPersonalOk;
Scene_Menu.prototype.onPersonalOk = function() {
    SAN.ActorBodysizeReactor.Scene_Menu_onPersonalOk.call(this);
    if (this._commandWindow.currentSymbol() === 'bodysize') {
        SceneManager.push(Scene_Bodysize);
    }
};

//-----------------------------------------------------------------------------
// Window_MenuCommand
//
// メニューコマンドウィンドウ

// メインコマンドの作成
SAN.ActorBodysizeReactor.Window_MenuCommand_addMainCommands = Window_MenuCommand.prototype.addMainCommands;
Window_MenuCommand.prototype.addMainCommands = function() {
    SAN.ActorBodysizeReactor.Window_MenuCommand_addMainCommands.call(this);
    this.addCommand('ボディサイズ', 'bodysize', true);
};

//-----------------------------------------------------------------------------
// Scene_Bodysize
//
// ボディサイズシーン

function Scene_Bodysize() {
    this.initialize.apply(this, arguments);
}

Scene_Bodysize.prototype = Object.create(Scene_MenuBase.prototype);
Scene_Bodysize.prototype.constructor = Scene_Bodysize;

// オブジェクト初期化
Scene_Bodysize.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
};

// 画面要素作成
Scene_Bodysize.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this._bodysizeWindow = new Window_Bodysize();
    this._bodysizeWindow.setHandler('cancel',   this.popScene.bind(this));
    this._bodysizeWindow.setHandler('pagedown', this.nextActor.bind(this));
    this._bodysizeWindow.setHandler('pageup',   this.previousActor.bind(this));
    this.addWindow(this._bodysizeWindow);
    this.refreshActor();
};

// アクターのリフレッシュ
Scene_Bodysize.prototype.refreshActor = function() {
    var actor = this.actor();
    this._bodysizeWindow.setActor(actor);
};

// アクター変更処理
Scene_Bodysize.prototype.onActorChange = function() {
    this.refreshActor();
    this._bodysizeWindow.activate();
};

//-----------------------------------------------------------------------------
// Window_Bodysize
//
// ボディサイズウィンドウ

function Window_Bodysize() {
    this.initialize.apply(this, arguments);
}

Window_Bodysize.prototype = Object.create(Window_Status.prototype);
Window_Bodysize.prototype.constructor = Window_Bodysize;

// オブジェクト初期化
Window_Bodysize.prototype.initialize = function() {
    Window_Status.prototype.initialize.call(this)
};

// ブロック2描画
Window_Bodysize.prototype.drawBlock2 = function(y) {
    this.drawActorFace(this._actor, 12, y);
    this.drawBasicInfo(204, y);
    this.drawSexAge(456, y);
};

// ブロック3描画
Window_Bodysize.prototype.drawBlock3 = function(y) {
    this.drawBodysize(48, y);
    this.drawStates(432, y);
};

// ボディサイズ描画
Window_Bodysize.prototype.drawBodysize = function(x, y) {
    var items = [];
    items.push({ label: "身長",   value: this._actor.bodysizeReactor().height().toFixed(1) + " cm"});
    items.push({ label: "体重",   value: this._actor.bodysizeReactor().weight().toFixed(1) + " kg"});
    items.push({ label: "B",      value: this._actor.bodysizeReactor().tBust().toFixed(0)  + " cm"});
    items.push({ label: "W",      value: this._actor.bodysizeReactor().waist().toFixed(0)  + " cm"});
    items.push({ label: "H",      value: this._actor.bodysizeReactor().hip().toFixed(0)    + " cm"});
    var lineHeight = this.lineHeight();
    if (this._actor.bodysizeReactor().sex() === 'female') {
        items.push({ label: "カップ", value: this._actor.bodysizeReactor().cup()});
    }
    for (var i = 0; i < items.length; i++) {
        var y2 = y + lineHeight * i;
        this.changeTextColor(this.systemColor());
        this.drawText(items[i].label, x, y2, 100);
        this.resetTextColor();
        this.drawText(items[i].value, x + 120, y2, 100, 'right');
    }
};

// 性別年齢描画
Window_Bodysize.prototype.drawSexAge = function(x, y) {
    var labelSex  = function (sex) {
        return (sex === 'male' ? "男性" : "女性");
    };
    var labelMAge = function (mAge) {
        return String(Math.floor(mAge / 12)) + "歳 " + String(mAge % 12) + "ヶ月";
    };
    var sex       = this._actor.bodysizeReactor().sex();
    var baseSex   = this._actor.bodysizeReactor().baseSex();
    var mAge      = this._actor.bodysizeReactor().mAge();
    var baseMAge  = this._actor.bodysizeReactor().baseMAge();
    var items = [];
    items.push({ label: "性別（実）", value: labelSex(sex)   + "（" + labelSex(baseSex)   + "）" });
    items.push({ label: "年齢（実）", value: labelMAge(mAge) + "（" + labelMAge(baseMAge) + "）" });
    var lineHeight = this.lineHeight();
    this.changeTextColor(this.systemColor());
    for (var i = 0; i < items.length; i++) {
        var y2 = y + lineHeight * 2 * i;
        this.changeTextColor(this.systemColor());
        this.drawText(items[i].label, x, y2, 270);
        this.resetTextColor();
        this.drawText(items[i].value, x, y2 + lineHeight,  270, 'right');
    }
};

// ステート描画
Window_Bodysize.prototype.drawStates = function(x, y) {
    var states = this._actor.states();
    var count = Math.min(states.length, this.maxStateLines());
    for (var i = 0; i < count; i++) {
        this.drawItemName(states[i], x, y + this.lineHeight() * i);
    }
};

// ステート描画行数
Window_Bodysize.prototype.maxStateLines = function() {
    return 6;
};

//-----------------------------------------------------------------------------
// Scene_ActorBodysizeEditor
//
// アクターボディサイズエディターシーン

function Scene_ActorBodysizeEditor() {
    this.initialize.apply(this, arguments);
}

Scene_ActorBodysizeEditor.prototype = Object.create(Scene_MenuBase.prototype);
Scene_ActorBodysizeEditor.prototype.constructor = Scene_ActorBodysizeEditor;

// オブジェクト初期化
Scene_ActorBodysizeEditor.prototype.initialize = function () {
    Scene_MenuBase.prototype.initialize.call(this);
};

// 文字列行高さ
Scene_ActorBodysizeEditor.lineHeight = function () {
    return 22;
};

// 標準フォントサイズ
Scene_ActorBodysizeEditor.standardFontSize = function() {
    return 12;
};

// 標準パディング
Scene_ActorBodysizeEditor.standardPadding = function() {
    return 12;
};

// 文字列パディング
Scene_ActorBodysizeEditor.textPadding = function() {
    return 6;
};

// データベースファイルセーブ
Scene_ActorBodysizeEditor.prototype.saveDatabaseFile = function(name, json) {
    if (StorageManager.isLocalMode()) {
        var fs = require('fs');
        var dirPath = this.databaseDirectoryPath();
        var filePath = name + '.json';
        fs.writeFileSync(dirPath + filePath, JSON.stringify(json, null, '    '));
    }
};

// データベースファイルディレクトリ
Scene_ActorBodysizeEditor.prototype.databaseDirectoryPath = function() {
    var path = window.location.pathname.replace(/\/[^\/]*$/, '/data/');
    if (path.match(/^\/([A-Z]\:)/)) {
        path = path.slice(1);
    }
    return decodeURIComponent(path);
};

// リアクターデータの保存
Scene_ActorBodysizeEditor.prototype.saveDataReactors = function () {
    if (StorageManager.isLocalMode()) {
        $dataActorBodysizeReactor = $dataActorBodysizeReactor.filter(function(parameters) {
            return parameters.name !== this.currentReactor().name();
        }, this);
        var dataParameters = {};
        for (var key in this.currentReactor().parameters()) {
            dataParameters[key] = this.currentReactor().parameters()[key];
        }
        $dataActorBodysizeReactor.push(dataParameters);
        this.sortDataReactors();
        this.saveDatabaseFile('SAN_ActorBodysizeReactor', $dataActorBodysizeReactor);
    }
};

// データベースのリアクターデータ削除
Scene_ActorBodysizeEditor.prototype.deleteDataReactor = function (name) {
    $dataActorBodysizeReactor = $dataActorBodysizeReactor.filter(function (parameters) {
        return parameters.name !== name;
    });
    this.sortDataReactors();
    this.saveDatabaseFile('SAN_ActorBodysizeReactor', $dataActorBodysizeReactor);
};

// リアクターデータのソート
Scene_ActorBodysizeEditor.prototype.sortDataReactors = function () {
    $dataActorBodysizeReactor.sort(function (parameters1, parameters2) {
        if (parameters1.name < parameters2.name) { return -1; }
        if (parameters1.name > parameters2.name) { return  1; }
        return 0;
    });
};

// リアクターデータの名称リスト
Scene_ActorBodysizeEditor.prototype.dataReactorNames = function () {
    return (
        $dataActorBodysizeReactor.map(function (parameters) {
            return parameters.name;
        }, this)
    );
};

// リアクターデータのパラメータ
Scene_ActorBodysizeEditor.prototype.dataReactorParameters = function (name) {
    for (var i = 0; i < $dataActorBodysizeReactor.length; i++) {
        if ($dataActorBodysizeReactor[i].name === name) {
            return $dataActorBodysizeReactor[i];
        }
    }
    return undefined;
};

// リアクター初期化
Scene_ActorBodysizeEditor.prototype.initReactors = function () {
    this._reactors = {
        upper:   new ActorBodysizeReactor(),
        lower:   new ActorBodysizeReactor(),
        preview: new ActorBodysizeReactor()
    };
};

// リアクター
Scene_ActorBodysizeEditor.prototype.reactor = function (type) {
    return this._reactors[type];
};

// プレビューリアクターのリフレッシュ
Scene_ActorBodysizeEditor.prototype.refreshPreviewReactor = function () {
    this._reactors['preview'].clear();
    this._reactors['preview'].mergeParameters(this._reactors['lower'].parameters());
    this._reactors['preview'].mergeParameters(this._reactors['upper'].parameters());
    this._reactors['preview'].setBaseName('preview');
};

// シーン構成要素作成
Scene_ActorBodysizeEditor.prototype.create = function () {
    Scene_MenuBase.prototype.create.call(this);
    this.initReactors();
    this.refreshPreviewReactor();
    this.createHelpWindow();                // ヘルプウィンドウ
    this.createMenuWindow();                // メニューウィンドウ
    this.createReactorChoiceWindow();       // リアクター選択ウィンドウ
    this.createLowerNameWindow();           // 下位リアクター名称ウィンドウ
    this.createUpperNameWindow();           // 上位リアクター名称ウィンドウ
    this.createLowerEditWindow();           // 下位リアクター編集ウィンドウ
    this.createUpperEditWindow();           // 上位リアクター編集ウィンドウ
    this.createPreviewLabelWindow();        // プレビューラベルウィンドウ
    this.createPreviewNameWindow();         // プレビューリアクター名称ウィンドウ
    this.createPreviewWindow();             // プレビューウィンドウ
    this.createNameEditWindow();            // 名称編集ウィンドウ
    this.createNameInputWindow();           // 名称入力ウィンドウ
    this.createNullChoiceWindow();          // NULL選択ウィンドウ
    this.createSexChoiceWindow();           // 性別選択ウィンドウ
    this.createIntegerInputWindow();        // 整数入力ウィンドウ
    this.createDecimalInputWindow();        // 小数入力ウィンドウ
    this.createDataReactorLabelWindow();    // データラベルウィンドウ
    this.createDataReactorChoiceWindow();   // データ選択ウィンドウ
    this.createQuitConfirmWindow();         // 終了確認ウィンドウ
};

// シーン開始
Scene_ActorBodysizeEditor.prototype.start = function () {
    Scene_MenuBase.prototype.start.call(this);
    this._menuWindow.activate();
};

// ヘルプウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createHelpWindow = function () {
    this._helpWindow = new Window_ABEHelp();
    this.addWindow(this._helpWindow);
};

// ヘルプウィンドウ
Scene_ActorBodysizeEditor.prototype.helpWindow = function () {
    return this._helpWindow;
};

// メニューウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createMenuWindow = function () {
    var x = 0
    var y = this._helpWindow.y + this._helpWindow.height;
    this._menuWindow = new Window_ABEMenu(x, y, this);
    this.addWindow(this._menuWindow);
};

// メニューウィンドウ
Scene_ActorBodysizeEditor.prototype.menuWindow = function () {
    return this._menuWindow;
};

// リアクター選択ウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createReactorChoiceWindow = function () {
    var x = 0;
    var y = this._menuWindow.y + this._menuWindow.height;
    this._reactorChoiceWindow = new Window_ABEReactorChoice(x, y, this);
    this.addWindow(this._reactorChoiceWindow);
};

// リアクター選択ウィンドウ
Scene_ActorBodysizeEditor.prototype.reactorChoiceWindow = function () {
    return this._reactorChoiceWindow;
};

// 下位リアクター名称ウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createLowerNameWindow = function () {
    var x = 0;
    var y = this._reactorChoiceWindow.y + this._reactorChoiceWindow.height;
    this._lowerNameWindow = new Window_ABEName(x, y, this, 'lower');
    this.addWindow(this._lowerNameWindow);
};

// 下位リアクター名称ウィンドウ
Scene_ActorBodysizeEditor.prototype.lowerNameWindow = function () {
    return this._lowerNameWindow;
};

// 上位リアクター名称ウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createUpperNameWindow = function () {
    var x = this._lowerNameWindow.x + this._lowerNameWindow.width;
    var y = this._reactorChoiceWindow.y + this._reactorChoiceWindow.height;
    this._upperNameWindow = new Window_ABEName(x, y, this, 'upper');
    this.addWindow(this._upperNameWindow);
};

// 上位リアクター名称ウィンドウ
Scene_ActorBodysizeEditor.prototype.upperNameWindow = function () {
    return this._upperNameWindow;
};

// 下位リアクター編集ウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createLowerEditWindow = function () {
    var x = 0;
    var y = this._lowerNameWindow.y + this._lowerNameWindow.height;
    this._lowerEditWindow = new Window_ABEReactorEdit(x, y, this, 'lower');
    this.addWindow(this._lowerEditWindow);
};

// 下位リアクター編集ウィンドウ
Scene_ActorBodysizeEditor.prototype.lowerEditWindow = function () {
    return this._lowerEditWindow;
};

// 上位リアクター編集ウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createUpperEditWindow = function () {
    var x = this._lowerEditWindow.x + this._lowerEditWindow.width;
    var y = this._upperNameWindow.y + this._upperNameWindow.height;
    this._upperEditWindow = new Window_ABEReactorEdit(x, y, this, 'upper');
    this.addWindow(this._upperEditWindow);
};

// 上位リアクター編集ウィンドウ
Scene_ActorBodysizeEditor.prototype.upperEditWindow = function () {
    return this._upperEditWindow;
};

// プレビューラベルウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createPreviewLabelWindow = function () {
    var x = this._reactorChoiceWindow.x + this._reactorChoiceWindow.width;
    var y = this._reactorChoiceWindow.y;
    var text = 'プレビュー';
    this._previewLabelWindow = new Window_ABELabel(x, y, this, text);
    this.addWindow(this._previewLabelWindow);
}

// プレビューラベルウィンドウ
Scene_ActorBodysizeEditor.prototype.previewLabelWindow = function () {
    return this._previewLabelWindow;
};

// プレビューリアクター名称ウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createPreviewNameWindow = function () {
    var x = this._previewLabelWindow.x;
    var y = this._previewLabelWindow.y + this._previewLabelWindow.height;
    this._previewNameWindow = new Window_ABEName(x, y, this, 'preview');
    this.addWindow(this._previewNameWindow);
};

// プレビューリアクター名称ウィンドウ
Scene_ActorBodysizeEditor.prototype.previewNameWindow = function () {
    return this._previewNameWindow;
};

// プレビューウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createPreviewWindow = function () {
    var x = this._previewNameWindow.x;
    var y = this._previewNameWindow.y + this._previewNameWindow.height;
    this._previewWindow = new Window_ABEBodysizePreview(x, y, this);
    this.addWindow(this._previewWindow);
};

// プレビューウィンドウ
Scene_ActorBodysizeEditor.prototype.previewWindow = function () {
    return this._previewWindow;
};

// 名称編集ウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createNameEditWindow = function () {
    this._nameEditWindow = new Window_ABENameEdit(this);
    this.addWindow(this._nameEditWindow);
};

// 名称編集ウィンドウ
Scene_ActorBodysizeEditor.prototype.nameEditWindow = function () {
    return this._nameEditWindow;
};

// 名称入力ウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createNameInputWindow = function() {
    this._nameInputWindow = new Window_ABENameInput(this);
    this.addWindow(this._nameInputWindow);
};

// 名称入力ウィンドウ
Scene_ActorBodysizeEditor.prototype.nameInputWindow = function() {
    return this._nameInputWindow;
};

// NULL選択ウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createNullChoiceWindow = function () {
    this._nullChoiceWindow = new Window_ABENullChoice(this);
    this.addWindow(this._nullChoiceWindow);
};

// NULL選択ウィンドウ
Scene_ActorBodysizeEditor.prototype.nullChoiceWindow = function () {
    return this._nullChoiceWindow;
};

// 性別選択ウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createSexChoiceWindow = function () {
    this._sexChoiceWindow = new Window_ABESexChoice(this);
    this.addWindow(this._sexChoiceWindow);
};

// 性別選択ウィンドウ
Scene_ActorBodysizeEditor.prototype.SexChoiceWindow = function () {
    return this._sexChoiceWindow;
};

// 整数入力ウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createIntegerInputWindow = function () {
    this._integerInputWindow = new Window_ABEIntegerInput(this);
    this.addWindow(this._integerInputWindow);
};

// 整数入力ウィンドウ
Scene_ActorBodysizeEditor.prototype.integerInputWindow = function () {
    return this._integerInputWindow;
};

// 小数入力ウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createDecimalInputWindow = function () {
    this._decimalInputWindow = new Window_ABEDecimalInput(this);
    this.addWindow(this._decimalInputWindow);
};

// 小数入力ウィンドウ
Scene_ActorBodysizeEditor.prototype.decimalInputWindow = function () {
    return this._decimalInputWindow;
};

// データラベルウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createDataReactorLabelWindow = function () {
    var x = this._previewLabelWindow.x + this._previewLabelWindow.width;
    var y = this._previewLabelWindow.y;
    var text = 'データベース';
    this._dataReactorLabelWindow = new Window_ABELabel(x, y, this, text);
    this.addWindow(this._dataReactorLabelWindow);
}

// データラベルウィンドウ
Scene_ActorBodysizeEditor.prototype.dataReactorLabelWindow = function () {
    return this._dataReactorLabelWindow;
};

// データ選択ウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createDataReactorChoiceWindow = function () {
    var x = this._dataReactorLabelWindow.x;
    var y = this._dataReactorLabelWindow.y + this._dataReactorLabelWindow.height;
    this._dataReactorChoiceWindow = new Window_ABEDataReactorChoice(x, y, this);
    this.addWindow(this._dataReactorChoiceWindow);
};

// データ選択ウィンドウ
Scene_ActorBodysizeEditor.prototype.dataReactorChoiceWindow = function () {
    return this._dataReactorChoiceWindow;
};

// 終了確認ウィンドウ作成
Scene_ActorBodysizeEditor.prototype.createQuitConfirmWindow = function () {
    this._quitConfirmWindow = new Window_ABEQuitConfirmWindow(this);
    this.addWindow(this._quitConfirmWindow);
};

// 終了確認ウィンドウ
Scene_ActorBodysizeEditor.prototype.quitConfirmWindow = function () {
    return this._quitConfirmWindow;
};

// 名称入力ウィンドウ呼び出し
Scene_ActorBodysizeEditor.prototype.callNameInputWindow = function () {
    this._nameEditWindow.open();
    this._nameInputWindow.setOriginal();
    this._nameInputWindow.refresh();
    this._nameInputWindow.open();
    this._nameInputWindow.activate();
};

// 整数入力ウィンドウ呼び出し
Scene_ActorBodysizeEditor.prototype.callIntegerInputWindow = function (maxValue, minValue, maxDigits) {
    var key = this.currentEditWindow().currentSymbol();
    this._integerInputWindow.setOriginal(this.currentReactor().parameters()[key]);
    this._integerInputWindow.setMaxValue(maxValue);
    this._integerInputWindow.setMinValue(minValue);
    this._integerInputWindow.setMaxDigits(maxDigits);
    this._integerInputWindow.start();
};

// 小数入力ウィンドウ呼び出し
Scene_ActorBodysizeEditor.prototype.callDecimalInputWindow = function (maxValue, minValue, maxDigits, maxDecimal) {
    var key = this.currentEditWindow().currentSymbol();
    this._decimalInputWindow.setOriginal(this.currentReactor().parameters()[key]);
    this._decimalInputWindow.setMaxValue(maxValue);
    this._decimalInputWindow.setMinValue(minValue);
    this._decimalInputWindow.setMaxDigits(maxDigits);
    this._decimalInputWindow.setMaxDecimal(maxDecimal);
    this._decimalInputWindow.start();
};

// NULL選択ウィンドウ呼び出し
Scene_ActorBodysizeEditor.prototype.callNullChoiceWindow = function () {
    var key = this.currentEditWindow().currentSymbol();
    this._nullChoiceWindow.setOriginal(this.currentReactor().parameters()[key]);
    this._nullChoiceWindow.updatePlacement()
    this._nullChoiceWindow.open();
    this._nullChoiceWindow.activate();
};

// 性別選択ウィンドウ呼び出し
Scene_ActorBodysizeEditor.prototype.callSexChoiceWindow = function () {
    var key = this.currentEditWindow().currentSymbol();
    this._sexChoiceWindow.setOriginal(this.currentReactor().parameters()[key]);
    this._sexChoiceWindow.updatePlacement()
    this._sexChoiceWindow.open();
    this._sexChoiceWindow.activate();
};

// 選択中の名称ウィンドウ
Scene_ActorBodysizeEditor.prototype.currentNameWindow = function () {
    switch (this._reactorChoiceWindow.currentSymbol()) {
    case 'lower':
        return this._lowerNameWindow;
    case 'upper':
        return this._upperNameWindow;
    };
};

// 選択中ではない名称ウィンドウ
Scene_ActorBodysizeEditor.prototype.anotherNameWindow = function () {
    switch (this._reactorChoiceWindow.currentSymbol()) {
    case 'lower':
        return this._upperNameWindow;
    case 'upper':
        return this._lowerNameWindow;
    };
};

// 選択中のパラメータ選択ウィンドウ
Scene_ActorBodysizeEditor.prototype.currentEditWindow = function () {
    switch (this._reactorChoiceWindow.currentSymbol()) {
    case 'lower':
        return this._lowerEditWindow;
    case 'upper':
        return this._upperEditWindow;
    };
};

// 選択中ではないパラメータ選択ウィンドウ
Scene_ActorBodysizeEditor.prototype.anotherEditWindow = function () {
    switch (this._reactorChoiceWindow.currentSymbol()) {
    case 'lower':
        return this._upperEditWindow;
    case 'upper':
        return this._lowerEditWindow;
    };
};

// 選択中のリアクター
Scene_ActorBodysizeEditor.prototype.currentReactor = function () {
    switch (this._reactorChoiceWindow.currentSymbol()) {
    case 'lower':
        return this.reactor('lower');
    case 'upper':
        return this.reactor('upper');
    };
};

// 選択中ではないリアクター
Scene_ActorBodysizeEditor.prototype.anotherReactor = function () {
    switch (this._reactorChoiceWindow.currentSymbol()) {
    case 'lower':
        return this.reactor('upper');
    case 'upper':
        return this.reactor('lower');
    };
};

//-----------------------------------------------------------------------------
// Window_ABEHelp
//
// ヘルプウィンドウ

function Window_ABEHelp() {
    this.initialize.apply(this, arguments);
}

Window_ABEHelp.prototype = Object.create(Window_Help.prototype);
Window_ABEHelp.prototype.constructor = Window_ABEHelp;

// 文字列行高さ
Window_ABEHelp.prototype.lineHeight = function () {
    return Scene_ActorBodysizeEditor.lineHeight();
};

// 標準フォントサイズ
Window_ABEHelp.prototype.standardFontSize = function () {
    return Scene_ActorBodysizeEditor.standardFontSize();
};

// 標準パディング
Window_ABEHelp.prototype.standardPadding = function () {
    return Scene_ActorBodysizeEditor.standardPadding();
};

// 文字列パディング
Window_ABEHelp.prototype.textPadding = function () {
    return Scene_ActorBodysizeEditor.textPadding();
};

//-----------------------------------------------------------------------------
// Window_ABEMenu
//
// メニューウィンドウ

function Window_ABEMenu() {
    this.initialize.apply(this, arguments);
}

Window_ABEMenu.prototype = Object.create(Window_HorzCommand.prototype);
Window_ABEMenu.prototype.constructor = Window_ABEMenu;

// オブジェクト初期化
Window_ABEMenu.prototype.initialize = function(x, y, scene) {
    this._scene = scene;
    Window_HorzCommand.prototype.initialize.call(this, x, y);
    this._helpWindow = this._scene.helpWindow();
    this.setHandler('ok', this.onOk.bind(this));
    this.setHandler('cancel', this.onCancel.bind(this));
};

// ウィンドウ幅
Window_ABEMenu.prototype.windowWidth = function () {
    return Graphics.boxWidth;
};

// 文字列行高さ
Window_ABEMenu.prototype.lineHeight = function () {
    return Scene_ActorBodysizeEditor.lineHeight();
};

// 標準フォントサイズ
Window_ABEMenu.prototype.standardFontSize = function () {
    return Scene_ActorBodysizeEditor.standardFontSize();
};

// 標準パディング
Window_ABEMenu.prototype.standardPadding = function () {
    return Scene_ActorBodysizeEditor.standardPadding();
};

// 文字列パディング
Window_ABEMenu.prototype.textPadding = function () {
    return Scene_ActorBodysizeEditor.textPadding();
};

// 最大列数
Window_ABEMenu.prototype.maxCols = function () {
    return this.commandList().length;
};

// コマンドリスト
Window_ABEMenu.prototype.commandList = function () {
    return [
        { name: "パラメータ編集", symbol: 'param',  enabled: true,
          ext:  "パラメータを編集します。\"null\"を設定した場合はマージ時に上書きされません。" },
        { name: "名称編集",       symbol: 'name',   enabled: true,
          ext:  "パラメータセットの名称を編集します。" },
        { name: "マージ",         symbol: 'merge',  enabled: true,
          ext:  "パラメータセットをもう一方のパラメータセットにマージします。" },
        { name: "クリア",         symbol: 'clear',  enabled: true,
          ext:  "選択したパラメータセットをクリアします。" },
        { name: "ロード",         symbol: 'load',   enabled: true,
          ext:  "データベースファイルからパラメータセットをロードします。" },
        { name: "セーブ",         symbol: 'save',   enabled: StorageManager.isLocalMode(),
          ext:  "パラメータセットをデータベースファイルにセーブします。" +
            (StorageManager.isLocalMode() ? "" : "\nローカルモード時のみ可能です。") },
        { name: "データ削除",     symbol: 'delete', enabled: StorageManager.isLocalMode(),
          ext:  "データベースファイルからパラメータセットを削除します。" +
            (StorageManager.isLocalMode() ? "" : "\nローカルモード時のみ可能です。") }
    ];
};

// コマンドリストの作成
Window_ABEMenu.prototype.makeCommandList = function () {
    this.commandList().forEach(function (command) {
        this.addCommand(command.name, command.symbol, command.enabled, command.ext);
    }, this);
};

// ヘルプウィンドウの更新
Window_ABEMenu.prototype.updateHelp = function () {
    this._scene.helpWindow().setText(this.currentData().ext);
};

// カーソルの下移動
Window_ABEMenu.prototype.cursorDown = function(wrap) {
    Window_HorzCommand.prototype.cursorDown.call(this, wrap);
    if (this.isCurrentItemEnabled()) {
        this.deactivate();
        this._scene.reactorChoiceWindow().activate();
        SoundManager.playCursor();
    }
};

// カーソルの右移動
Window_ABEMenu.prototype.cursorRight = function (wrap) {
    Window_HorzCommand.prototype.cursorRight.call(this, wrap);
    this.callUpdateHelp();
};

// カーソルの左移動
Window_ABEMenu.prototype.cursorLeft = function (wrap) {
    Window_HorzCommand.prototype.cursorLeft.call(this, wrap);
    this.callUpdateHelp();
};

// 決定処理
Window_ABEMenu.prototype.onOk = function () {
    switch (this.currentSymbol()) {
    default:
        this.deactivate();
        this._scene.reactorChoiceWindow().activate();
        break;
    }
};

// キャンセル処理
Window_ABEMenu.prototype.onCancel = function () {
    this.deactivate();
    this._scene.quitConfirmWindow().open();
    this._scene.quitConfirmWindow().refresh();
    this._scene.quitConfirmWindow().activate();
};

//-----------------------------------------------------------------------------
// Window_ABEReactorChoice
//
// リアクター選択ウィンドウ

function Window_ABEReactorChoice() {
    this.initialize.apply(this, arguments);
}

Window_ABEReactorChoice.prototype = Object.create(Window_HorzCommand.prototype);
Window_ABEReactorChoice.prototype.constructor = Window_ABEReactorChoice;

// オブジェクト初期化
Window_ABEReactorChoice.prototype.initialize = function (x, y, scene) {
    this._scene = scene;
    Window_HorzCommand.prototype.initialize.call(this, x, y);
    this._helpWindow = this._scene._helpWindow;
    this.setHandler('ok', this.onOk.bind(this));
    this.setHandler('cancel', this.onCancel.bind(this));
    this.select(0);
    this.deactivate();
};

// ウィンドウ幅
Window_ABEReactorChoice.prototype.windowWidth = function () {
    return Graphics.boxWidth * (4 / 10);
};

// 文字列行高さ
Window_ABEReactorChoice.prototype.lineHeight = function () {
    return Scene_ActorBodysizeEditor.lineHeight();
};

// 標準フォントサイズ
Window_ABEReactorChoice.prototype.standardFontSize = function () {
    return Scene_ActorBodysizeEditor.standardFontSize();
};

// 標準パディング
Window_ABEReactorChoice.prototype.standardPadding = function () {
    return Scene_ActorBodysizeEditor.standardPadding();
};

// 文字列パディング
Window_ABEReactorChoice.prototype.textPadding = function () {
    return Scene_ActorBodysizeEditor.textPadding();
};

// 最大列数
Window_ABEReactorChoice.prototype.maxCols = function () {
    return this.commandList().length;
};

// ヘルプテキスト
Window_ABEReactorChoice.prototype.helpText = function () {
    return "パラメータセットを選択してください。";
};

// コマンドリスト
Window_ABEReactorChoice.prototype.commandList = function () {
    return [
        { name: "下位パラメータセット", symbol: 'lower', enabled: true },
        { name: "上位パラメータセット", symbol: 'upper', enabled: true }
    ];
};

// コマンドリストの作成
Window_ABEReactorChoice.prototype.makeCommandList = function () {
    this.commandList().forEach(function (command) {
        this.addCommand(command.name, command.symbol, command.enable);
    }, this);
};

// ヘルプウィンドウの更新
Window_ABEReactorChoice.prototype.updateHelp = function () {
    var menuExt = this._scene.menuWindow().currentExt();
    this._helpWindow.setText(menuExt + "\n" + this.helpText());
};

// カーソルの上移動
Window_ABEReactorChoice.prototype.cursorUp = function(wrap) {
    Window_HorzCommand.prototype.cursorUp.call(this, wrap);
    this.onCancel();
    SoundManager.playCursor();
};

// 決定処理
Window_ABEReactorChoice.prototype.onOk = function () {
    switch (this._scene.menuWindow().currentSymbol()) {
    case 'param':
        this._scene.currentEditWindow().select(0);
        this._scene.currentEditWindow().activate();
        break;
    case 'name':
        this._scene.callNameInputWindow();
        break;
    case 'merge':
        this._scene.anotherReactor().mergeParameters(this._scene.currentReactor().parameters());
        this._scene.anotherEditWindow().refresh();
        this._scene.previewWindow().refresh();
        this.activate();
        break;
    case 'clear':
        this._scene.currentReactor().clear();
        this._scene.currentEditWindow().refresh();
        this._scene.previewWindow().refresh();
        this.activate();
        break;
    case 'load':
        this._scene.dataReactorChoiceWindow().setOriginal();
        this._scene.dataReactorChoiceWindow().onCursorMove();
        this._scene.dataReactorChoiceWindow().activate();
        break;
    case 'save':
        this._scene.saveDataReactors();
        this._scene.dataReactorChoiceWindow().refresh();
        this.activate();
        break;
    case 'delete':
        this._scene.dataReactorChoiceWindow().select(0);
        this._scene.dataReactorChoiceWindow().onCursorMove();
        this._scene.dataReactorChoiceWindow().activate();
        break;
    };
};

// キャンセル処理
Window_ABEReactorChoice.prototype.onCancel = function () {
    this.deactivate();
    this._scene.menuWindow().activate();
};


//-----------------------------------------------------------------------------
// Window_ABEName
//
// 名称ウィンドウ

function Window_ABEName() {
    this.initialize.apply(this, arguments);
}

Window_ABEName.prototype = Object.create(Window_Base.prototype);
Window_ABEName.prototype.constructor = Window_ABEName;

// オブジェクト初期化
Window_ABEName.prototype.initialize = function(x, y, scene, reactorType) {
    this._scene = scene;
    this._reactorType = reactorType;
    this._text = '';
    var width = Graphics.boxWidth * ((reactorType === 'preview' ? 3 : 2) / 10);
    var height = this.fittingHeight(1);
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
};

// 文字列行高さ
Window_ABEName.prototype.lineHeight = function () {
    return Scene_ActorBodysizeEditor.lineHeight();
};

// 標準フォントサイズ
Window_ABEName.prototype.standardFontSize = function () {
    return Scene_ActorBodysizeEditor.standardFontSize();
};

// 標準パディング
Window_ABEName.prototype.standardPadding = function () {
    return Scene_ActorBodysizeEditor.standardPadding();
};

// 文字列パディング
Window_ABEName.prototype.textPadding = function () {
    return Scene_ActorBodysizeEditor.textPadding();
};

// 文字列クリア
Window_ABEName.prototype.clear = function() {
    this.contents.clear();
};

// リフレッシュ
Window_ABEName.prototype.refresh = function() {
    var reactor = this._scene.reactor(this._reactorType);
    this._text = reactor.parameters().name
    this.contents.clear();
    this.drawText(this._text, 0, 0, this.contents.width, 'center');
};

//-----------------------------------------------------------------------------
// Window_ABEReactorEdit
//
// リアクター編集ウィンドウ

function Window_ABEReactorEdit() {
    this.initialize.apply(this, arguments);
}

Window_ABEReactorEdit.prototype = Object.create(Window_Command.prototype);
Window_ABEReactorEdit.prototype.constructor = Window_ABEReactorEdit;

// オブジェクト初期化
Window_ABEReactorEdit.prototype.initialize = function (x, y, scene, reactorType) {
    this._scene = scene;
    this._reactorType = reactorType;
    Window_Command.prototype.initialize.call(this, x, y);
    this._helpWindow = this._scene.helpWindow();
    this.width = this.windowWidth();
    this.height = this.windowHeight();
    this.x = this.windowX();
    this.setHandler('ok', this.onOk.bind(this));
    this.setHandler('cancel', this.onCancel.bind(this));
    this.refresh();
    this.deselect();
    this.deactivate();
};

// ウィンドウ幅
Window_ABEReactorEdit.prototype.windowWidth = function () {
    return Graphics.boxWidth * (2 / 10);
};

// ウィンドウ高さ
Window_ABEReactorEdit.prototype.windowHeight = function () {
    return !!this.height ? Graphics.boxHeight - this.y : 1;
};

// ウィンドウX座標
Window_ABEReactorEdit.prototype.windowX = function () {
    return (
        this._reactorType === 'lower' ? 0 :
        this._reactorType === 'upper' ? this.windowWidth() :
        undefined
    );
};

// ウィンドウY座標
Window_ABEReactorEdit.prototype.windowY = function () {
    return this.y;
};

// 文字列行高さ
Window_ABEReactorEdit.prototype.lineHeight = function () {
    return Scene_ActorBodysizeEditor.lineHeight();
};

// 標準フォントサイズ
Window_ABEReactorEdit.prototype.standardFontSize = function () {
    return Scene_ActorBodysizeEditor.standardFontSize();
};

// 標準パディング
Window_ABEReactorEdit.prototype.standardPadding = function () {
    return Scene_ActorBodysizeEditor.standardPadding();
};

// 文字列パディング
Window_ABEReactorEdit.prototype.textPadding = function () {
    return Scene_ActorBodysizeEditor.textPadding();
};

// 表示行数
Window_ABEReactorEdit.prototype.numVisibleRows = function () {
    return this.maxItems();
};

// コマンドリスト
Window_ABEReactorEdit.prototype.commandList = function () {
    return [
        { name: "性別",         symbol: 'sex',     enabled: true,
          ext:  "性別を選択します。\"null\"を設定した場合は'male'として扱います。" },
        { name: "月齢",         symbol: 'mAge',    enabled: true,
          ext:  "月齢を設定します。" +
                "96以上の範囲で設定可能です。\"null\"を設定した場合は216ヶ月(18歳0ヶ月)として扱います。" },
        { name: "身長係数",     symbol: 'height',  enabled: true,
          ext:  "身長係数を設定します。" +
                "0.00から2.00の範囲で設定可能。1.00が標準です。\"null\"を設定した場合は1.00として扱われます。" },
        { name: "体重係数",     symbol: 'weight',  enabled: true,
          ext:  "体重係数を設定します。" +
                "0.00から2.00の範囲で設定可能。1.00が標準です。\"null\"を設定した場合は1.00として扱われます。" },
        { name: "Tバスト係数",  symbol: 'tBust',   enabled: true,
          ext:  "トップバスト係数を設定します。" +
                "0.00から2.00の範囲で設定可能。1.00が標準です。\"null\"を設定した場合は1.00として扱われます。" },
        { name: "Uバスト係数",  symbol: 'uBust',   enabled: true,
          ext:  "アンダーバスト係数を設定します。" +
                "0.00から2.00の範囲で設定可能。1.00が標準です。\"null\"を設定した場合は1.00として扱われます。" },
        { name: "ウエスト係数", symbol: 'waist',   enabled: true,
          ext:  "ウエスト係数を設定します。" +
                "0.00から2.00の範囲で設定可能。1.00が標準です。\"null\"を設定した場合は1.00として扱われます。" },
        { name: "ヒップ係数",   symbol: 'hip',     enabled: true,
          ext:  "ヒップ係数を設定します。" +
                "0.00から2.00の範囲で設定可能。1.00が標準です。\"null\"を設定した場合は1.00として扱われます。" },
        { name: "太腿係数",     symbol: 'thigh',   enabled: true,
          ext:  "ヒップ係数を設定します。" +
                "0.00から2.00の範囲で設定可能。1.00が標準です。\"null\"を設定した場合は1.00として扱われます。" },
        { name: "足長係数",     symbol: 'foot',    enabled: true,
          ext:  "足長係数を設定します。" +
                "0.00から2.00の範囲で設定可能。1.00が標準です。\"null\"を設定した場合は1.00として扱われます。" },
        { name: "手長係数",     symbol: 'hand',    enabled: true,
          ext:  "手長係数を設定します。" +
                "0.00から2.00の範囲で設定可能。1.00が標準です。\"null\"を設定した場合は1.00として扱われます。" },
        { name: "肥満係数",     symbol: 'fatness', enabled: true,
          ext:  "肥満係数を設定します。" +
                "0.00から2.00の範囲で設定可能。1.00が標準です。\"null\"を設定した場合は1.00として扱われます。" }
    ];
};

// コマンドリストの作成
Window_ABEReactorEdit.prototype.makeCommandList = function () {
    this.commandList().forEach(function (command) {
        this.addCommand(command.name, command.symbol, command.enable, command.ext);
    }, this);
};

// 項目の描画
Window_ABEReactorEdit.prototype.drawItem = function (index) {
    var name = this.commandList()[index].name + "：";
    var reactor = this.reactor();
    var key = this.commandList()[index].symbol;
    var value = reactor.parameters()[key]
    if (key !== 'sex' && key !== 'mAge' && value !== null) {
        value = String(Number(value).toFixed(2));
    } else {
        value = String(value);
    }
    var rect = this.itemRectForText(index);
    this.resetFontSettings();
    this.changePaintOpacity(this.isCommandEnabled(index));
    this.drawText(name, rect.x, rect.y, rect.width);
    this.drawText(value, rect.x, rect.y, rect.width, 'right');
};

// ヘルプウィンドウの更新
Window_ABEReactorEdit.prototype.updateHelp = function () {
    var menuExt = this._scene.menuWindow().currentExt();
    this._helpWindow.setText(menuExt + "\n" + this.currentExt());
};

// リアクター
Window_ABEReactorEdit.prototype.reactor = function () {
    return this._scene.reactor(this._reactorType);
};

// 他方のリアクター編集ウィンドウ
Window_ABEReactorEdit.prototype.anotherEditWindow = function () {
    switch (this._reactorType) {
    case 'lower':
        return this._scene.upperEditWindow();
    case 'upper':
        return this._scene.lowerEditWindow();
    }
};

// カーソルの右移動
Window_ABEReactorEdit.prototype.cursorRight = function (wrap) {
    Window_Command.prototype.cursorRight.call(this, wrap);
    if (this._reactorType === 'lower') {
        this.anotherEditWindow().select(this.index());
        this.deselect();
        this.deactivate();
        this._scene.reactorChoiceWindow().selectSymbol('upper');
        this.anotherEditWindow().activate();
        SoundManager.playCursor();
    }
};

// カーソルの左移動
Window_ABEReactorEdit.prototype.cursorLeft = function (wrap) {
    Window_Command.prototype.cursorLeft.call(this, wrap);
    if (this._reactorType === 'upper') {
        this.anotherEditWindow().select(this.index());
        this.deselect();
        this.deactivate();
        this._scene.reactorChoiceWindow().selectSymbol('lower');
        this.anotherEditWindow().activate();
        SoundManager.playCursor();
    }
};

// 決定処理
Window_ABEReactorEdit.prototype.onOk = function () {
    this.deactivate();
    this._scene.callNullChoiceWindow();
};

// キャンセル処理
Window_ABEReactorEdit.prototype.onCancel = function () {
    this.deselect();
    this.deactivate();
    this._scene.reactorChoiceWindow().activate();
};

//-----------------------------------------------------------------------------
// Window_ABELabel
//
// ラベルウィンドウ

function Window_ABELabel() {
    this.initialize.apply(this, arguments);
}

Window_ABELabel.prototype = Object.create(Window_Base.prototype);
Window_ABELabel.prototype.constructor = Window_ABELabel;

// オブジェクト初期化
Window_ABELabel.prototype.initialize = function(x, y, scene, text) {
    this._scene = scene;
    this._text = text;
    var width = Graphics.boxWidth * (3 / 10);
    var height = this.fittingHeight(1);
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
};

// 文字列行高さ
Window_ABELabel.prototype.lineHeight = function () {
    return Scene_ActorBodysizeEditor.lineHeight();
};

// 標準フォントサイズ
Window_ABELabel.prototype.standardFontSize = function () {
    return Scene_ActorBodysizeEditor.standardFontSize();
};

// 標準パディング
Window_ABELabel.prototype.standardPadding = function () {
    return Scene_ActorBodysizeEditor.standardPadding();
};

// 文字列パディング
Window_ABELabel.prototype.textPadding = function () {
    return Scene_ActorBodysizeEditor.textPadding();
};

// 文字列クリア
Window_ABELabel.prototype.clear = function() {
    this.contents.clear();
};

// リフレッシュ
Window_ABELabel.prototype.refresh = function() {
    this.contents.clear();
    this.drawText(this._text, 0, 0, this.contents.width, 'center');
};

//-----------------------------------------------------------------------------
// Window_ABEBodysizePreview
//
// プレビューウィンドウ

function Window_ABEBodysizePreview () {
    this.initialize.apply(this, arguments);    
}

Window_ABEBodysizePreview.prototype = Object.create(Window_Selectable.prototype);
Window_ABEBodysizePreview.prototype.constructor = Window_ABEBodysizePreview;

// オブジェクト初期化
Window_ABEBodysizePreview.prototype.initialize = function (x, y, scene) {
    this._scene = scene;
    Window_Selectable.prototype.initialize.call(this, x, y, 1, 1);
    this.width = this.windowWidth();
    this.height = this.windowHeight();
    this.deselect();
    this.refresh();
};

// ウィンドウ幅
Window_ABEBodysizePreview.prototype.windowWidth = function () {
    return Graphics.boxWidth * (3 / 10);
};

// ウィンドウ高さ
Window_ABEBodysizePreview.prototype.windowHeight = function () {
    return !!this.height ? Graphics.boxHeight - this.y : 1;
};

// 文字列行高さ
Window_ABEBodysizePreview.prototype.lineHeight = function () {
    return Scene_ActorBodysizeEditor.lineHeight();
};

// 標準フォントサイズ
Window_ABEBodysizePreview.prototype.standardFontSize = function () {
    return Scene_ActorBodysizeEditor.standardFontSize();
};

// 標準パディング
Window_ABEBodysizePreview.prototype.standardPadding = function () {
    return Scene_ActorBodysizeEditor.standardPadding();
};

// 文字列パディング
Window_ABEBodysizePreview.prototype.textPadding = function () {
    return Scene_ActorBodysizeEditor.textPadding();
};

// 項目リスト
Window_ABEBodysizePreview.prototype.itemList = function () {
    var valueAge = function (mAge) {
        return String(Math.floor(mAge / 12)) + "歳 " + String(mAge % 12) + "ヶ月";
    };
    return [
        { name: "性別",         value: this.reactor().sex() === 'male' ? "男性" : "女性" },
        { name: "年齢",         value: valueAge(this.reactor().mAge()) },
        { name: "身長",         value: String(Number(this.reactor().height()).toFixed(1)) + " cm" },
        { name: "体重",         value: String(Number(this.reactor().weight()).toFixed(1)) + " kg" },
        { name: "Tバスト",      value: String(Number(this.reactor().tBust()).toFixed(1))  + " cm" },
        { name: "Uバスト",      value: String(Number(this.reactor().uBust()).toFixed(1))  + " cm" },
        { name: "ウエスト",     value: String(Number(this.reactor().waist()).toFixed(1))  + " cm" },
        { name: "ヒップ",       value: String(Number(this.reactor().hip()).toFixed(1))    + " cm" },
        { name: "太腿",         value: String(Number(this.reactor().thigh()).toFixed(1))  + " cm" },
        { name: "足長",         value: String(Number(this.reactor().foot()).toFixed(1))   + " cm" },
        { name: "手長",         value: String(Number(this.reactor().hand()).toFixed(1))   + " cm" },
        { name: "BMI値",        value: String(Number(this.reactor().bmi()).toFixed(1)) },
        { name: "ローレル指数", value: String(Number(this.reactor().rohrer()).toFixed(1)) },
        { name: "カップ",       value: String(this.reactor().cup()) }
    ];
};

// リフレッシュ
Window_ABEBodysizePreview.prototype.refresh = function () {
    Window_Selectable.prototype.refresh.call(this);
    this._scene.refreshPreviewReactor();
    this.createContents();
    this.drawItem();
};

// 内容の描画
Window_ABEBodysizePreview.prototype.drawItem = function () {
    var itemList = this.itemList();
    for(var i = 0; i < itemList.length; i++) {
        var rect = this.itemRectForText(i);
        this.resetFontSettings();
        this.changePaintOpacity(true);
        this.drawText(itemList[i].name, rect.x, rect.y, rect.width);
        this.drawText(itemList[i].value, rect.x, rect.y, rect.width, 'right');
    }
};

// リアクター
Window_ABEBodysizePreview.prototype.reactor = function () {
    return this._scene.reactor('preview');
}

//-----------------------------------------------------------------------------
// Window_ABENullChoice
//
// NULL選択ウィンドウ

function Window_ABENullChoice() {
    this.initialize.apply(this, arguments);
}

Window_ABENullChoice.prototype = Object.create(Window_Command.prototype);
Window_ABENullChoice.prototype.constructor = Window_ABENullChoice;

// オブジェクト初期化
Window_ABENullChoice.prototype.initialize = function (scene) {
    this._scene = scene;
    this._originalValue = null;
    Window_Command.prototype.initialize.call(this, 0, 0);
    this.openness = 0;
    this.deactivate();
};

// ウィンドウ幅
Window_ABENullChoice.prototype.windowWidth = function() {
    return Graphics.boxWidth * (1 / 10);
};

// 文字列行高さ
Window_ABENullChoice.prototype.lineHeight = function () {
    return Scene_ActorBodysizeEditor.lineHeight();
};

// 標準フォントサイズ
Window_ABENullChoice.prototype.standardFontSize = function () {
    return Scene_ActorBodysizeEditor.standardFontSize();
};

// 標準パディング
Window_ABENullChoice.prototype.standardPadding = function () {
    return Scene_ActorBodysizeEditor.standardPadding();
};

// 文字列パディング
Window_ABENullChoice.prototype.textPadding = function () {
    return Scene_ActorBodysizeEditor.textPadding();
};

// 表示行数
Window_ABENullChoice.prototype.numVisibleRows = function() {
    return this.maxItems();
};

// 最大項目数
Window_ABENullChoice.prototype.maxItems = function() {
    return this._list.length;
};

// 次ウィンドウの初期値の設定
Window_ABENullChoice.prototype.setOriginal = function (value) {
    this._originalValue = value;
};

// 位置の更新
Window_ABENullChoice.prototype.updatePlacement = function () {
    this.width = this.windowWidth();
    this.height = this.windowHeight();
    this.x = this._scene.currentEditWindow().x;
    this.y = Graphics.boxHeight - this.height;
};

// コマンドリストの作成
Window_ABENullChoice.prototype.makeCommandList = function() {
    this.addCommand('input', 'input', true);
    this.addCommand('null', null, true);
};

// キャンセル許可判定
Window_ABENullChoice.prototype.isCancelEnabled = function () {
    return true;
};

// カーソルの下移動
Window_ABENullChoice.prototype.cursorDown = function(wrap) {
    Window_Command.prototype.cursorDown.call(this, wrap);
    this.onCursorMove();
};

// カーソルの上移動
Window_ABENullChoice.prototype.cursorUp = function(wrap) {
    Window_Command.prototype.cursorUp.call(this, wrap);
    this.onCursorMove();
};

// カーソル移動による更新
Window_ABENullChoice.prototype.onCursorMove = function() {
    var reactor = this._scene.currentReactor();
    var key = this._scene.currentEditWindow().currentSymbol();
    reactor.parameters()[key] = (this.currentSymbol() === null ? null : this._originalValue);
    this._scene.previewWindow().refresh();
};

// 決定処理
Window_ABENullChoice.prototype.processOk = function () {
    Window_Command.prototype.processOk.call(this);
    this.deactivate();
    this.close();
    var reactor = this._scene.currentReactor();
    var key = this._scene.currentEditWindow().currentSymbol();
    if (this.currentSymbol() === null) {
        reactor.parameters()[key] = null;
        this._scene.previewWindow().refresh();
        this._scene.currentEditWindow().refresh();
        this._scene.currentEditWindow().activate();
    } else {
        switch (key) {
        case 'sex':
            this._scene.callSexChoiceWindow();
            break;
        case 'mAge':
            this._scene.callIntegerInputWindow(999, 96, 3)
            break;
        default:
            this._scene.callDecimalInputWindow(2.00, 0.00, 1, 2);
            break;
        }
    }
};

// キャンセル処理
Window_ABENullChoice.prototype.processCancel = function () {
    Window_Command.prototype.processCancel.call(this);
    var reactor = this._scene.currentReactor();
    var key = this._scene.currentEditWindow().currentSymbol();
    reactor.parameters()[key] = this._originalValue;
    this.deactivate();
    this.close();
    this._scene.previewWindow().refresh();
    this._scene.currentEditWindow().refresh();
    this._scene.currentEditWindow().activate();
};

//-----------------------------------------------------------------------------
// Window_ABESexChoice
//
// 性別選択ウィンドウ

function Window_ABESexChoice() {
    this.initialize.apply(this, arguments);
}

Window_ABESexChoice.prototype = Object.create(Window_Command.prototype);
Window_ABESexChoice.prototype.constructor = Window_ABESexChoice;

// オブジェクト初期化
Window_ABESexChoice.prototype.initialize = function (scene) {
    this._scene = scene;
    this._originalValue = 'male';
    Window_Command.prototype.initialize.call(this, 0, 0);
    this.openness = 0;
    this.deactivate();
};

// ウィンドウ幅
Window_ABESexChoice.prototype.windowWidth = function() {
    return Graphics.boxWidth * (1 / 10);
};

// 文字列行高さ
Window_ABESexChoice.prototype.lineHeight = function () {
    return Scene_ActorBodysizeEditor.lineHeight();
};

// 標準フォントサイズ
Window_ABESexChoice.prototype.standardFontSize = function () {
    return Scene_ActorBodysizeEditor.standardFontSize();
};

// 標準パディング
Window_ABESexChoice.prototype.standardPadding = function () {
    return Scene_ActorBodysizeEditor.standardPadding();
};

// 文字列パディング
Window_ABESexChoice.prototype.textPadding = function () {
    return Scene_ActorBodysizeEditor.textPadding();
};

// 表示行数
Window_ABESexChoice.prototype.numVisibleRows = function() {
    return this.maxItems();
};

// 最大項目数
Window_ABESexChoice.prototype.maxItems = function() {
    return this._list.length;
};

// 次ウィンドウの初期値の設定
Window_ABESexChoice.prototype.setOriginal = function (value) {
    this._originalValue = value;
    if (value === null) {
        this.selectSymbol('male');
        var reactor = this._scene.currentReactor();
        var key = 'sex';
        reactor.parameters()[key] = this.currentSymbol();
    }
};

// 位置の更新
Window_ABESexChoice.prototype.updatePlacement = function () {
    this.width = this.windowWidth();
    this.height = this.windowHeight();
    this.x = this._scene.currentEditWindow().x;
    this.y = Graphics.boxHeight - this.height;
};

// コマンドリストの作成
Window_ABESexChoice.prototype.makeCommandList = function() {
    this.addCommand('male', 'male', true);
    this.addCommand('female', 'female', true);
};

// キャンセル許可判定
Window_ABESexChoice.prototype.isCancelEnabled = function () {
    return true;
};

// カーソルの下移動
Window_ABESexChoice.prototype.cursorDown = function(wrap) {
    Window_Command.prototype.cursorDown.call(this, wrap);
    this.onCursorMove();
};

// カーソルの上移動
Window_ABESexChoice.prototype.cursorUp = function(wrap) {
    Window_Command.prototype.cursorUp.call(this, wrap);
    this.onCursorMove();
};

// カーソル移動による更新
Window_ABESexChoice.prototype.onCursorMove = function() {
    var reactor = this._scene.currentReactor();
    var key = this._scene.currentEditWindow().currentSymbol();
    reactor.parameters()[key] = this.currentSymbol();
    this._scene.previewWindow().refresh();
};

// 決定処理
Window_ABESexChoice.prototype.processOk = function () {
    Window_Command.prototype.processOk.call(this);
    var reactor = this._scene.currentReactor();
    var key = this._scene.currentEditWindow().currentSymbol();
    reactor.parameters()[key] = this.currentSymbol();
    this.deactivate();
    this.close();
    this._scene.previewWindow().refresh();
    this._scene.currentEditWindow().refresh();
    this._scene.currentEditWindow().activate();
};

// キャンセル処理
Window_ABESexChoice.prototype.processCancel = function () {
    Window_Command.prototype.processCancel.call(this);
    var reactor = this._scene.currentReactor();
    var key = this._scene.currentEditWindow().currentSymbol();
    reactor.parameters()[key] = this._originalValue;
    this.deactivate();
    this.close();
    this._scene.previewWindow().refresh();
    this._scene.currentEditWindow().refresh();
    this._scene.currentEditWindow().activate();
};


//-----------------------------------------------------------------------------
// Window_ABENameEdit
//
// 名称編集ウィンドウ

function Window_ABENameEdit() {
    this.initialize.apply(this, arguments);
}

Window_ABENameEdit.prototype = Object.create(Window_Help.prototype);
Window_ABENameEdit.prototype.constructor = Window_ABENameEdit;

// オブジェクト初期化
Window_ABENameEdit.prototype.initialize = function(scene) {
    this._scene = scene;
    Window_Help.prototype.initialize.call(this);
    this.width = this._scene.previewWindow().width;
    this.height = this.fittingHeight(1);
    this.x = this._scene.previewWindow().x;
    this.y = this._scene.previewWindow().y;
    this.openness = 0;
};

// 文字列行高さ
Window_ABENameEdit.prototype.lineHeight = function () {
    return Scene_ActorBodysizeEditor.lineHeight();
};

// 標準フォントサイズ
Window_ABENameEdit.prototype.standardFontSize = function () {
    return Scene_ActorBodysizeEditor.standardFontSize();
};

// 標準パディング
Window_ABENameEdit.prototype.standardPadding = function () {
    return Scene_ActorBodysizeEditor.standardPadding();
};

// 文字列パディング
Window_ABENameEdit.prototype.textPadding = function () {
    return Scene_ActorBodysizeEditor.textPadding();
};

// リフレッシュ
Window_ABENameEdit.prototype.refresh = function () {
    this.setText(this._scene.nameInputWindow() ? this._scene.nameInputWindow().currentName() : '');
    Window_Help.prototype.refresh.call(this);
};

//-----------------------------------------------------------------------------
// Window_ABENameInput
//
// 名称入力ウィンドウ

function Window_ABENameInput() {
    this.initialize.apply(this, arguments);
}

Window_ABENameInput.prototype = Object.create(Window_NameInput.prototype);
Window_ABENameInput.prototype.constructor = Window_ABENameInput;

// オブジェクト初期化
Window_ABENameInput.prototype.initialize = function(scene) {
    this._scene = scene;
    this._currentName = '';
    this._originalName = '';
    this._nameIndex = 0;
    this._maxLength = 32;
    Window_Selectable.prototype.initialize.call(this, 0, 0, this.windowWidth(), this.windowHeight());
    this.x = this._scene.nameEditWindow().x;
    this.y = this._scene.nameEditWindow().y + this._scene.nameEditWindow().height;
    this.openness = 0;
    this._page = 0;
    this._index = 0;
    this.refresh();
    this.updateCursor();
};

// ウィンドウ幅
Window_ABENameInput.prototype.windowWidth = function() {
    return Graphics.boxWidth * (3 / 10);
};

// ウィンドウ高さ
Window_ABENameInput.prototype.windowHeight = function() {
    return this.fittingHeight(9);
};

// 文字列行高さ
Window_ABENameInput.prototype.lineHeight = function () {
    return Scene_ActorBodysizeEditor.lineHeight();
};

// 標準フォントサイズ
Window_ABENameInput.prototype.standardFontSize = function () {
    return Scene_ActorBodysizeEditor.standardFontSize();
};

// 標準パディング
Window_ABENameInput.prototype.standardPadding = function () {
    return Scene_ActorBodysizeEditor.standardPadding();
};

// 文字列パディング
Window_ABENameInput.prototype.textPadding = function () {
    return Scene_ActorBodysizeEditor.textPadding();
};

// 文字テーブル
Window_ABENameInput.prototype.table = function() {
    return [Window_NameInput.LATIN1,
            Window_NameInput.LATIN2];
};

// 項目の矩形
Window_ABENameInput.prototype.itemRect = function(index) {
    var width = Math.floor((this.windowWidth() - this.standardPadding()) / 11);
    return {
        x: index % 10 * width + Math.floor(index % 10 / 5) * Math.floor(width / 2),
        y: Math.floor(index / 10) * this.lineHeight(),
        width: width,
        height: this.lineHeight()
    };
};

// 元の名前の設定
Window_ABENameInput.prototype.setOriginal = function () {
    this._originalName = this._scene.currentReactor().name();
    this._currentName = this._originalName;
    this._nameIndex = this._originalName.length;
};

// リフレッシュ
Window_ABENameInput.prototype.refresh = function() {
    Window_NameInput.prototype.refresh.call(this);
    this._scene.nameEditWindow().refresh();
};

// 名前の取得
Window_ABENameInput.prototype.currentName = function () {
    return this._currentName;
};

// キャンセル処理
Window_ABENameInput.prototype.processCancel = function() {
    this.processBack();
};

// 後退処理
Window_ABENameInput.prototype.processBack = function() {
    if (this._nameIndex > 0) {
        this._nameIndex--;
        this._currentName = this._currentName.slice(0, this._nameIndex);
    } else {
        this._nameIndex = this._originalName.length;
        this._currentName = this._originalName;
        this._index = 89;
    }
    this.refresh();
    SoundManager.playCancel();
};

// 決定処理
Window_ABENameInput.prototype.processOk = function() {
    if (this.character()) {
        this.onNameAdd();
    } else if (this.isPageChange()) {
        SoundManager.playOk();
        this.cursorPagedown();
    } else if (this.isOk()) {
        this.onNameOk();
    }
};

// 名前追加処理
Window_ABENameInput.prototype.onNameAdd = function() {
    if (this._nameIndex < this._maxLength) {
        this._nameIndex++;
        this._currentName = this._currentName + this.character();
        this.refresh();
        SoundManager.playOk();
    } else {
        SoundManager.playBuzzer();
    }
};

// 名前確定処理
Window_ABENameInput.prototype.onNameOk = function() {
    if (this._currentName === '') {
        this._currentName = this._originalName;
        this.refresh();
        SoundManager.playOk();
    } else {
        this._scene.nameEditWindow().close();
        this.close();
        this.deactivate();
        this._scene.currentReactor().setBaseName(this._currentName);
        this._scene.currentNameWindow().refresh();
        this._scene.reactorChoiceWindow().activate();
        SoundManager.playOk();
    }
};

//-----------------------------------------------------------------------------
// Window_ABEIntegerInput
//
// 整数入力ウィンドウ

function Window_ABEIntegerInput () {
    this.initialize.apply(this, arguments);
}

Window_ABEIntegerInput.prototype = Object.create(Window_NumberInput.prototype);
Window_ABEIntegerInput.prototype.constructor = Window_ABEIntegerInput;

// オブジェクト初期化
Window_ABEIntegerInput.prototype.initialize = function (scene) {
    this._scene = scene;
    this._maxDigits = 1;
    this._maxValue = 0;
    this._minValue = 0;
    this._originalValue = 0;
    this._currentValue = 0;
    Window_Selectable.prototype.initialize.call(this, 0, 0, 1, 1);
    this.openness = 0;
    this.createButtons();
    this.deactivate();
};

// 文字列行高さ
Window_ABEIntegerInput.prototype.lineHeight = function () {
    return Scene_ActorBodysizeEditor.lineHeight();
};

// 標準フォントサイズ
Window_ABEIntegerInput.prototype.standardFontSize = function () {
    return Scene_ActorBodysizeEditor.standardFontSize();
};

// 標準パディング
Window_ABEIntegerInput.prototype.standardPadding = function () {
    return Scene_ActorBodysizeEditor.standardPadding();
};

// 文字列パディング
Window_ABEIntegerInput.prototype.textPadding = function () {
    return Scene_ActorBodysizeEditor.textPadding();
};

// 項目の幅
Window_ABEIntegerInput.prototype.itemWidth = function() {
    return this.standardFontSize() + this.textPadding();
};

// 数値の設定
Window_ABEIntegerInput.prototype.setOriginal = function (value) {
    this._originalValue = value;
    this._currentValue = (value === null ? 216 : value);
    var reactor = this._scene.currentReactor();
    var key = this._scene.currentEditWindow().currentSymbol();
    reactor.parameters()[key] = this._currentValue;
    this.refresh();
};

// 最大値の設定
Window_ABEIntegerInput.prototype.setMaxValue = function (maxValue) {
    this._maxValue = maxValue;
};

// 最小値の設定
Window_ABEIntegerInput.prototype.setMinValue = function (minValue) {
    this._minValue = minValue;
};

// 最大桁数の設定
Window_ABEIntegerInput.prototype.setMaxDigits = function (maxDigits) {
    this._maxDigits = maxDigits;
};

// ウィンドウ処理開始
Window_ABEIntegerInput.prototype.start = function () {
    this.updatePlacement();
    this.placeButtons();
    this.updateButtonsVisiblity();
    this.createContents();
    this.refresh();
    this.open();
    this.activate();
    this.select(this.maxItems() - 1);
};

// 位置の更新
Window_ABEIntegerInput.prototype.updatePlacement = function () {
    this.width = this.windowWidth();
    this.height = this.windowHeight();
    this.x = this._scene.currentEditWindow().x;
    this.y = Graphics.boxHeight - this.height;
};

// 最大桁数
Window_ABEIntegerInput.prototype.maxCols = function () {
    return this._maxDigits + 1;
};

// 最大項目数
Window_ABEIntegerInput.prototype.maxItems = function () {
    return this._maxDigits + 1;
};

// 項目描画
Window_ABEIntegerInput.prototype.drawItem = function (index) {
    var rect = this.itemRect(index);
    var align = 'center';
    var c = '';
    var s = Math.abs(this._currentValue).padZero(this._maxDigits);
    if (index === 0) {
        c = this._currentValue < 0 ? '-' : this._currentValue > 0 ? '+' : '±';
    } else  {
        c = s.slice(index - 1, index);
    }
    this.resetTextColor();
    this.drawText(c, rect.x, rect.y, rect.width, align);
};

// リフレッシュ
Window_ABEIntegerInput.prototype.refresh = function () {
    Window_NumberInput.prototype.refresh.call(this);
    this._scene.previewWindow().refresh();
};

// 数値変更
Window_ABEIntegerInput.prototype.changeDigit = function (up) {
    var index = this.index();
    var place = Math.pow(10, this._maxDigits - 1 - index + 1);
    if (index === 0) {
        if (this._currentValue * -1 >= this._minValue && this._currentValue * -1 <= this._maxValue) {
            this._currentValue *= -1;
        }
    } else if (up) {
        this._currentValue = Math.min(this._currentValue + place, this._maxValue);
    } else {
        this._currentValue = Math.max(this._currentValue - place, this._minValue);
    }
    var reactor = this._scene.currentReactor();
    var key = this._scene.currentEditWindow().currentSymbol();
    reactor.parameters()[key] = this._currentValue;
    this.refresh();
    SoundManager.playCursor();
};

// タッチボタンY座標
Window_ABEIntegerInput.prototype.buttonY = function () {
    var spacing = 8;
    return 0 - this._buttons[0].height - spacing;
};

// キャンセル許可判定
Window_ABEIntegerInput.prototype.isCancelEnabled = function () {
    return true;
};

// 決定入力判定
Window_ABEIntegerInput.prototype.isOkTriggered = function () {
    return Input.isTriggered('ok');
};

// 決定処理
Window_ABEIntegerInput.prototype.processOk = function () {
    Window_Selectable.prototype.processOk.call(this);
    var reactor = this._scene.currentReactor();
    var key = this._scene.currentEditWindow().currentSymbol();
    reactor.parameters()[key] = this._currentValue;
    this.refresh();
    this.close();
    this.deactivate();
    this._scene.currentEditWindow().refresh();
    this._scene.currentEditWindow().activate();
};

// キャンセル処理
Window_ABEIntegerInput.prototype.processCancel = function () {
    var reactor = this._scene.currentReactor();
    var key = this._scene.currentEditWindow().currentSymbol();
    reactor.parameters()[key] = this._originalValue;
    Window_Selectable.prototype.processCancel.call(this);
    this.refresh();
    this.close();
    this.deactivate();
    this._scene.currentEditWindow().refresh();
    this._scene.currentEditWindow().activate();
};

//-----------------------------------------------------------------------------
// Window_ABEDecimalInput
//
// 小数入力ウィンドウ

function Window_ABEDecimalInput () {
    this.initialize.apply(this, arguments);    
}

Window_ABEDecimalInput.prototype = Object.create(Window_ABEIntegerInput.prototype);
Window_ABEDecimalInput.prototype.constructor = Window_ABEDecimalInput;

// オブジェクト初期化
Window_ABEDecimalInput.prototype.initialize = function (scene) {
    Window_ABEIntegerInput.prototype.initialize.call(this, scene);
    this._maxDecimal = 1;
};

// 元の数値の設定
Window_ABEDecimalInput.prototype.setOriginal = function (value) {
    this._originalValue = value;
    this._currentValue = (value === null ? 1.0 : value);
    var reactor = this._scene.currentReactor();
    var key = this._scene.currentEditWindow().currentSymbol();
    reactor.parameters()[key] = this._currentValue;
    this.refresh();
};

// 有効数字の設定
Window_ABEDecimalInput.prototype.setMaxDecimal = function (maxDecimal) {
    this._maxDecimal = maxDecimal;
};

// 最大桁数
Window_ABEDecimalInput.prototype.maxCols = function () {
    return this._maxDigits + 1 + this._maxDecimal;
};

// 最大項目数
Window_ABEDecimalInput.prototype.maxItems = function () {
    return this._maxDigits + 1 + this._maxDecimal;
};

// 全ての項目描画
Window_ABEDecimalInput.prototype.drawAllItems = function() {
    Window_ABEIntegerInput.prototype.drawAllItems.call(this);
    var rect = this.pointRect();
    var align = 'center';
    this.resetTextColor();
    this.drawText('.', rect.x, rect.y, rect.width, align);
};

// 項目描画
Window_ABEDecimalInput.prototype.drawItem = function (index) {
    var rect = this.itemRect(index);
    var align = 'center';
    var c = '';
    var s = Math.abs(this._currentValue).toFixed(this._maxDecimal).padZero(this._maxDigits + this._maxDecimal + 1);
    if (index === 0) {
        c = this._currentValue < 0 ? '-' : this._currentValue > 0 ? '+' : '±';
    } else if (index <= this._maxDigits) {
        c = s.slice(index - 1, index);
    } else if (index > this._maxDigits) {
        c = s.slice(index, index + 1);
    }
    this.resetTextColor();
    this.drawText(c, rect.x, rect.y, rect.width, align);
};

// 項目の矩形
Window_ABEDecimalInput.prototype.itemRect = function(index) {
    var rect = new Rectangle();
    var maxCols = this.maxCols();
    rect.width = this.itemWidth();
    rect.height = this.itemHeight();
    rect.x = index % maxCols * (rect.width + this.spacing()) - this._scrollX;
    rect.y = Math.floor(index / maxCols) * rect.height - this._scrollY;
    return rect;

};

// 小数点の矩形
Window_ABEDecimalInput.prototype.pointRect = function() {
    var rect = new Rectangle();
    rect.width = this.itemWidth();
    rect.height = this.itemHeight();
    rect.x = (this._maxDigits + 0.5) * (rect.width + this.spacing());
    rect.y = 0;
    return rect;
};

// 数値変更
Window_ABEDecimalInput.prototype.changeDigit = function (up) {
    var index = this.index();
    var place = Math.pow(10, this._maxDigits - 1 - index + 1);
    if (index === 0) {
        this._currentValue *= -1;
    } else if (up) {
        this._currentValue += place;
    } else {
        this._currentValue -= place;
    }
    this._currentValue = Math.min(this._currentValue, this._maxValue);
    this._currentValue = Math.max(this._currentValue, this._minValue);
    this._currentValue = Number(this._currentValue.toFixed(this._maxDecimal));
    var reactor = this._scene.currentReactor();
    var key = this._scene.currentEditWindow().currentSymbol();
    reactor.parameters()[key] = this._currentValue;
    this.refresh();
    SoundManager.playCursor();
};

//-----------------------------------------------------------------------------
// Window_ABEDataReactorChoice
//
// リアクターデータ選択ウィンドウ

function Window_ABEDataReactorChoice() {
    this.initialize.apply(this, arguments);
}

Window_ABEDataReactorChoice.prototype = Object.create(Window_Command.prototype);
Window_ABEDataReactorChoice.prototype.constructor = Window_ABEDataReactorChoice;

// オブジェクト初期化
Window_ABEDataReactorChoice.prototype.initialize = function (x, y, scene) {
    this._scene = scene;
    this._originalParameters = null;
    Window_Command.prototype.initialize.call(this, x, y);
    this.width = this.windowWidth();
    this.height = this.windowHeight();
    this.setHandler('ok', this.onOk.bind(this));
    this.setHandler('cancel', this.onCancel.bind(this));
    this.refresh();
    this.deselect();
    this.deactivate();
};

// ウィンドウ幅
Window_ABEDataReactorChoice.prototype.windowWidth = function () {
    return Graphics.boxWidth * (3 / 10)
};

// ウィンドウ高さ
Window_ABEDataReactorChoice.prototype.windowHeight = function () {
    return !!this.height ? Graphics.boxHeight - this.y : 1;
};

// 文字列行高さ
Window_ABEDataReactorChoice.prototype.lineHeight = function () {
    return Scene_ActorBodysizeEditor.lineHeight();
};

// 標準フォントサイズ
Window_ABEDataReactorChoice.prototype.standardFontSize = function () {
    return Scene_ActorBodysizeEditor.standardFontSize();
};

// 標準パディング
Window_ABEDataReactorChoice.prototype.standardPadding = function () {
    return Scene_ActorBodysizeEditor.standardPadding();
};

// 文字列パディング
Window_ABEDataReactorChoice.prototype.textPadding = function () {
    return Scene_ActorBodysizeEditor.textPadding();
};

// 初期値の設定
Window_ABEDataReactorChoice.prototype.setOriginal = function (parameters) {
    this._originalParameters = this._scene.currentReactor().parameters();
    this.selectName(this._scene.currentReactor().name());
};

// コマンドリストの作成
Window_ABEDataReactorChoice.prototype.makeCommandList = function() {
    var dataReactorNames = this._scene.dataReactorNames();
    dataReactorNames.forEach(function (name) {
        this.addCommand(name, name, true);
    }, this);
};

// 指定した名称のデータにカーソルを移動
Window_ABEDataReactorChoice.prototype.selectName = function (name) {
    this.select(0);
    this._list.forEach( function (item, index) {
        if (this._list[index].name === name) {
            this.select(index);
        }
    }, this);
};

// リフレッシュ
Window_ABEDataReactorChoice.prototype.refresh = function() {
    Window_Command.prototype.refresh.call(this);
    this._scene.currentNameWindow().refresh();
    this._scene.currentEditWindow().refresh();
    this._scene.previewWindow().refresh();
};

// 元の値に戻す
Window_ABEDataReactorChoice.prototype.restoreOriginal = function () {
    var reactorParameters = this._originalParameters;
    this._scene.currentReactor().setupByParameters(reactorParameters);
    this.refresh();
};

// カーソルの下移動
Window_ABEDataReactorChoice.prototype.cursorDown = function(wrap) {
    Window_Command.prototype.cursorDown.call(this, wrap);
    this.onCursorMove();
};

// カーソルの上移動
Window_ABEDataReactorChoice.prototype.cursorUp = function(wrap) {
    Window_Command.prototype.cursorUp.call(this, wrap);
    this.onCursorMove();
};

// カーソルの右移動
Window_ABEDataReactorChoice.prototype.cursorRight = function(wrap) {
    Window_Command.prototype.cursorRight.call(this, wrap);
    this.select(this.index() + Math.floor(this.contents.height / this.lineHeight()));
    if (this.index() >= this.maxItems()) {
        this.select(this.maxItems() - 1);
    }
    this.onCursorMove();
};

// カーソルの左移動
Window_ABEDataReactorChoice.prototype.cursorLeft = function(wrap) {
    Window_Command.prototype.cursorLeft.call(this, wrap);
    this.select(this.index() - Math.floor(this.contents.height / this.lineHeight()));
    if (this.index() < 0) {
        this.select(0);
    }
    this.onCursorMove();
};

// カーソル移動による更新
Window_ABEDataReactorChoice.prototype.onCursorMove = function () {
    var reactorParameters = this._scene.dataReactorParameters(this.currentSymbol());
    this._scene.currentReactor().setupByParameters(reactorParameters);
    this.refresh();
};

// タッチ処理
Window_ABEDataReactorChoice.prototype.onTouch = function(triggered) {
    Window_Command.prototype.onTouch.call(this, triggered);
    this.onCursorMove();
};

// 決定処理
Window_ABEDataReactorChoice.prototype.onOk = function () {
    if (this._scene.menuWindow().currentSymbol() === 'delete') {
        this._scene.deleteDataReactor(this.currentSymbol());
        this.restoreOriginal();
        this.activate();
    } else {
        this.deselect();
        this.deactivate();
        this._scene.reactorChoiceWindow().activate();
    }
};

// キャンセル処理
Window_ABEDataReactorChoice.prototype.onCancel = function () {
    this.restoreOriginal();
    this.deselect();
    this.deactivate();
    this._scene.reactorChoiceWindow().activate();
};

//-----------------------------------------------------------------------------
// Window_ABEQuitConfirmWindow
//
// 終了確認ウィンドウ

function Window_ABEQuitConfirmWindow() {
    this.initialize.apply(this, arguments);
}

Window_ABEQuitConfirmWindow.prototype = Object.create(Window_Command.prototype);
Window_ABEQuitConfirmWindow.prototype.constructor = Window_ABEQuitConfirmWindow;

// オブジェクト初期化
Window_ABEQuitConfirmWindow.prototype.initialize = function (scene) {
    this._scene = scene;
    Window_Command.prototype.initialize.call(this, 0, 0);
    this.openness = 0;
    this._helpWindow = this._scene.helpWindow();
    this.updatePlacement();
    this.deactivate();
};

// ウィンドウ幅
Window_ABEQuitConfirmWindow.prototype.windowWidth = function() {
    return Graphics.boxWidth * (1 / 10);
};

// 文字列行高さ
Window_ABEQuitConfirmWindow.prototype.lineHeight = function () {
    return Scene_ActorBodysizeEditor.lineHeight();
};

// 標準フォントサイズ
Window_ABEQuitConfirmWindow.prototype.standardFontSize = function () {
    return Scene_ActorBodysizeEditor.standardFontSize();
};

// 標準パディング
Window_ABEQuitConfirmWindow.prototype.standardPadding = function () {
    return Scene_ActorBodysizeEditor.standardPadding();
};

// 文字列パディング
Window_ABEQuitConfirmWindow.prototype.textPadding = function () {
    return Scene_ActorBodysizeEditor.textPadding();
};

// 表示行数
Window_ABEQuitConfirmWindow.prototype.numVisibleRows = function() {
    return this.maxItems();
};

// 最大項目数
Window_ABEQuitConfirmWindow.prototype.maxItems = function() {
    return this._list.length;
};

// ヘルプテキスト
Window_ABEQuitConfirmWindow.prototype.helpText = function () {
    return "編集画面を終了します。\nよろしいですか？"
}

// ヘルプウィンドウの更新
Window_ABEQuitConfirmWindow.prototype.updateHelp = function () {
    this._helpWindow.setText(this.helpText());
}

// 位置の更新
Window_ABEQuitConfirmWindow.prototype.updatePlacement = function () {
    this.width = this.windowWidth();
    this.height = this.windowHeight();
    this.x = (Graphics.boxWidth - this.width) / 2;
    this.y = (Graphics.boxHeight - this.height) / 2;
};

// コマンドリストの作成
Window_ABEQuitConfirmWindow.prototype.makeCommandList = function() {
    this.addCommand('OK', 'ok', true);
    this.addCommand('Cancel', 'cancel', true);
};

// キャンセル許可判定
Window_ABEQuitConfirmWindow.prototype.isCancelEnabled = function () {
    return true;
};

// 決定処理
Window_ABEQuitConfirmWindow.prototype.processOk = function () {
    Window_Command.prototype.processOk.call(this);
    switch(this.currentSymbol()) {
    case 'ok':
        this.close();
        this.deactivate();
        $gameParty.battleMembers().forEach(function (actor) {
            actor.bodysizeReactor().setupByActorId(actor.actorId());
        });
        this._scene.popScene();
        break;
    case 'cancel':
        this.close();
        this.deactivate();
        this._scene.menuWindow().activate();
        break;
    }
};

// キャンセル処理
Window_ABEQuitConfirmWindow.prototype.processCancel = function () {
    Window_Command.prototype.processCancel.call(this);
    this.selectSymbol('cancel');
    this.activate();
};

//-----------------------------------------------------------------------------
// Game_Interpreter
//
// インタープリター

// プラグインコマンド
SAN.ActorBodysizeReactor.Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function (command, args) {
    SAN.ActorBodysizeReactor.Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === 'SAN_ActorBodysizeReactor') {
        switch (args[0]) {
        case 'CallEditor':
            SceneManager.push(Scene_ActorBodysizeEditor);
            break;
        }
    }
};

}) (Sanshiro);
