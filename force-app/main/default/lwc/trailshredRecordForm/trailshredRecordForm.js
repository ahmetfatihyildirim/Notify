import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getSettings from '@salesforce/apex/TrailshredController.getSettings';

export default class TrailshredRecordForm extends NavigationMixin(LightningElement) {

    @api recordId;
    @api objectApiName;
    @api mode = 'view';
    @api layoutColumns = 2;
    @api layoutType = 'Full';
    trailshredFieldValueSettings = [];
    recordCache = [];

    connectedCallback() {
        const that = this;
        getSettings({
            'objectApiName' : this.objectApiName
        }).then( ( response ) => {
            that.onSettingsLoaded( response );
        }).catch( ( error ) => {
            throw error;
        });
    }

    onRecordLoad( event ) {
        const record = ( event.detail && event.detail.records && event.detail.records[this.recordId] );
        this.addRecordToCache( record );
        this.handleRecordFields( record );
    }

    handleRecordFields( newRecord ) {

        if ( !newRecord ) {
            return;
        }

        if ( this.trailshredFieldValueSettings && this.trailshredFieldValueSettings.length > 0 ) {

            const that = this;
            const audios = [];

            const oldRecord = this.recordCache.find( ( record ) => {
                
                return ( record.systemModstamp < newRecord.systemModstamp );
            });

            if ( oldRecord && newRecord ) {

                this.clearRecordCache();
                this.addRecordToCache( newRecord );

                this.trailshredFieldValueSettings.forEach( ( setting ) => {

                    let fieldName = setting.Field_Name__r.QualifiedApiName;
                    if ( fieldName.startsWith( that.objectApiName + '.' ) ) {
                        fieldName = fieldName.substring( that.objectApiName.length + 1 );
                    }

                    let lookupFieldName = that.getLookupFieldName( fieldName );

                    let oldField = oldRecord.fields[fieldName];
                    let oldFieldValue = String( ( oldField.value && oldField.value.id ) || oldField.value );

                    let newField = newRecord.fields[fieldName];
                    let newFieldValue = String( ( newField.value && newField.value.id ) || newField.value );
                    
                    let newFieldDisplayValue = String(
                        ( newRecord.fields[fieldName] && newRecord.fields[fieldName].displayValue ) ||
                        ( newRecord.fields[lookupFieldName] && newRecord.fields[lookupFieldName].displayValue )
                    );

                    let fieldValueChanged = ( oldFieldValue !== newFieldValue );
                    let newFieldValueMatchesTargetValue = ( newFieldValue === setting.Field_Value__c );
                    let newFieldDisplayValueMatchesTargetValue = ( newFieldDisplayValue === setting.Field_Value__c );

                    if ( fieldValueChanged && ( newFieldValueMatchesTargetValue || newFieldDisplayValueMatchesTargetValue ) ) {
                        let cacheBuster = new Date().getTime();
                        audios.push( new Audio( '/resource/' + cacheBuster + '/' + setting.Audio_Static_Resource_Path__c ) );
                    }

                });

            }

            this.playAudioFilesInSequence( audios )();

        }

    }

    onSettingsLoaded( settings ) {
        const that = this;
        if ( settings && settings.length > 0 ) {
            this.trailshredFieldValueSettings = settings.filter( ( setting ) => {
                return (
                    setting.Active__c &&
                    setting.Audio_Static_Resource_Path__c &&
                    setting.Object_Name__c &&
                    setting.Object_Name__r &&
                    setting.Object_Name__r.QualifiedApiName === that.objectApiName &&
                    setting.Field_Name__c &&
                    setting.Field_Name__r &&
                    setting.Field_Name__r.QualifiedApiName
                );
            });
        }
    }

    getLookupFieldName( fieldName ) {
        let lookupFieldName = fieldName;
        if ( fieldName ) {
            let lowercaseFieldName = fieldName.toLowerCase();
            if ( lowercaseFieldName.endsWith( 'id' ) ) {
                
                lookupFieldName = fieldName.slice( 0, -2 );
            } else if ( lowercaseFieldName.endsWith( '__c' ) ) {
                
                lookupFieldName = fieldName.slice( 0, -1 ) + 'r';
            }
        }
        return lookupFieldName;
    }

    playAudioFilesInSequence( audios, currentIndex = 0 ) {
        const that = this;
        return function() {
            if ( currentIndex < audios.length ) {
                let audio = audios[currentIndex];
                audio.addEventListener( 'ended', that.playAudioFilesInSequence( audios, ++currentIndex ) );
                audio.load();
                audio.play();
            }
        };
    }

    addRecordToCache( record, maxCachedRecords = 5 ) {
        
        if ( record ) {
            this.recordCache.unshift( record );
        }
        
        this.recordCache.length = Math.min( this.recordCache.length, Math.max( maxCachedRecords, 0 ) );
    }

    clearRecordCache() {
        this.recordCache.length = 0;
    }

}