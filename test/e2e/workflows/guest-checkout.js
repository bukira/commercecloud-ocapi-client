/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2017 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/**
 * Shop API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: 17.8
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */
import expect from 'expect.js'
import ShopApi from '../../../src/index'
import Order from '../../../src/models/order'
import * as dataSamples from '../../samples'

import {clientId, proxyUrl, baseUrl} from '../../config.json'
import * as utils from '../../utils'

let instance
let client
let newCustomer

before(() => {
    client = new ShopApi.ApiClient({
        basePath: `${baseUrl}`,
        defaultHeaders: {'x-dw-client-id': clientId}
    })
})

beforeEach(() => {
    return utils.getGuestUserAuth(client)
        .then((customer) => {
            newCustomer = customer
            return Promise.resolve()
        })
})

afterEach(() => utils.clearUserAuth(client))

const getProperty = (object, getter, property) => {
    // Use getter method if present; otherwise, get the property directly.
    if (typeof object[getter] === 'function') { return object[getter]() } else { return object[property] }
}

const setProperty = (object, setter, property, value) => {
    // Use setter method if present; otherwise, set the property directly.
    if (typeof object[setter] === 'function') { object[setter](value) } else { object[property] = value }
}

describe('workflows', () => {
    describe('guest checkout e2e', () => {
        it('should be able to complete checkout flow successfully', () => {
            const basketApi = new ShopApi.BasketsApi(client)
            const ordersApi = new ShopApi.OrdersApi(client)

            let orderTotal

            // Get new basket
            return basketApi.postBaskets({
                body: {
                    customer_info: dataSamples.validCustomerInfo
                }
            })
                .then((basket) => {
                    // Add product to basket
                    return basketApi.postBasketsByIDItems(basket.basket_id, [dataSamples.validProductItem])
                })
                .then((basket) => {
                    // Add billing address to the basket
                    return basketApi.putBasketsByIDBillingAddress(basket.basket_id, {
                        useAsShipping: true,
                        body: dataSamples.validOrderAddress
                    })
                })
                .then((basket) => {
                    // Add billing address to the basket
                    return basketApi.patchBasketsByIDShipmentsByID(basket.basket_id, 'me', {
                        shipping_method: {
                            id: 'standardshipping'
                        }
                    })
                })
                .then((basket) => {
                    // Save amount for later when we patch the order payment instrument.
                    orderTotal = basket.order_total

                    // Add payment information to the basket.
                    return basketApi.postBasketsByIDPaymentInstruments(basket.basket_id, dataSamples.validCustomerPaymentInstrumentRequest)
                })
                .then((basket) => {
                    // Create the order by posting the basket.
                    return ordersApi.postOrders(basket)
                })
                .then((order) => {
                    const paymentInstrumentId = order.payment_instruments[0].payment_instrument_id

                    const requestObj = dataSamples.validOrderPaymentInstrumentRequest
                    requestObj.amount = orderTotal

                    // Patch the orders payment instrument to trigger the authorization
                    return ordersApi.patchOrdersByIDPaymentInstrumentsByID(order.order_no, paymentInstrumentId, requestObj)
                })
                .then((order) => {
                    console.log(`Order: ${order.order_no} ('${order.confirmation_status}')`)

                    expect(order).to.be.an('object')
                })
        })
    })
})